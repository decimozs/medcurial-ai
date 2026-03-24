import { eq } from 'drizzle-orm';
import { AGENT_URL } from '@/constants';
import { db } from '@/db';
import { protectedRouteMiddleware } from '@/middlewares/protected';
import {
  ApprovalSchema,
  documentsTable,
  InsertDocumentSchema,
  UpdateDocumentSchema,
} from '@/schemas';
import { factory, zValidator } from '@/utils';

export const documentRoutes = factory
  .createApp()
  .get('/', protectedRouteMiddleware, async (c) => {
    const data = await db.query.documentsTable.findMany({
      orderBy: (item, { desc }) => [desc(item.createdAt)],
    });

    return c.json(data);
  })
  .get('/:id', protectedRouteMiddleware, async (c) => {
    const { id } = c.req.param();
    const data = await db.query.documentsTable.findFirst({
      where: (item, { eq }) => eq(item.id, id),
    });

    if (!data) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json(data);
  })
  .post(
    '/',
    protectedRouteMiddleware,
    zValidator('json', InsertDocumentSchema),
    async (c) => {
      const body = c.req.valid('json');

      try {
        const [data] = await db.insert(documentsTable).values(body).returning();

        if (!data) {
          return c.json({ error: 'Failed to create document' }, 500);
        }

        if (body.extractedText && AGENT_URL) {
          // Trigger agent in background
          (async () => {
            try {
              const agentResponse = await fetch(`${AGENT_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extracted_text: body.extractedText }),
              });

              if (agentResponse.ok) {
                const fraudAnalysis = await agentResponse.json();
                await db
                  .update(documentsTable)
                  .set({ fraudAnalysis, status: 'completed' })
                  .where(eq(documentsTable.id, data.id));
              } else {
                console.error('Agent analysis error on creation');
                await db
                  .update(documentsTable)
                  .set({ status: 'failed' })
                  .where(eq(documentsTable.id, data.id));
              }
            } catch (err) {
              console.error('Background analysis error on creation:', err);
              await db
                .update(documentsTable)
                .set({ status: 'failed' })
                .where(eq(documentsTable.id, data.id));
            }
          })();
        }

        return c.json(data);
      } catch (error) {
        return c.json({ error: 'Failed to create document' }, 500);
      }
    }
  )
  .put(
    '/:id',
    protectedRouteMiddleware,
    zValidator('json', UpdateDocumentSchema),
    async (c) => {
      const { id } = c.req.param();
      const body = c.req.valid('json');

      const hasExtractedText = body.extractedText !== undefined;

      try {
        // 1. Perform initial update (atomic)
        const [updatedDocument] = await db
          .update(documentsTable)
          .set(body)
          .where(eq(documentsTable.id, id))
          .returning();

        if (!updatedDocument) {
          return c.json({ error: 'Document not found' }, 404);
        }

        // 2. Determine if analysis should be triggered
        // ONLY trigger if:
        // - status is specifically set to 'processing' in body
        // - AND current status is NOT 'processing' (to prevent double calls)
        // OR if extractedText is provided and no fraud analysis exists
        const isRequestingAnalysis = body.status === 'processing';
        
        // Get the PREVIOUS status to compare
        const existingDoc = await db.query.documentsTable.findFirst({
          where: eq(documentsTable.id, id)
        });

        const shouldTriggerAgent = (isRequestingAnalysis && existingDoc?.status !== 'processing') || 
                                  (hasExtractedText && !existingDoc?.fraudAnalysis && existingDoc?.status !== 'processing');

        if (shouldTriggerAgent && AGENT_URL) {
          const textToAnalyze = body.extractedText || updatedDocument.extractedText;
          if (textToAnalyze) {
            // Force status to 'processing' so the UI shows "Analyzing..."
            await db
              .update(documentsTable)
              .set({ status: 'processing' })
              .where(eq(documentsTable.id, id));
            
            // Update the document instance we return to the client
            updatedDocument.status = 'processing';

            // Trigger agent in background to avoid client timeouts (especially worker retries)
            (async () => {
              try {
                const agentResponse = await fetch(`${AGENT_URL}/analyze`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ extracted_text: textToAnalyze }),
                });

                if (agentResponse.ok) {
                  const fraudAnalysis = await agentResponse.json();
                  await db
                    .update(documentsTable)
                    .set({ fraudAnalysis, status: 'completed' })
                    .where(eq(documentsTable.id, id));
                  console.log(`Analysis completed for document ${id}`);
                } else {
                  console.error('Agent analysis error for doc', id);
                  await db
                    .update(documentsTable)
                    .set({ status: 'failed' })
                    .where(eq(documentsTable.id, id));
                }
              } catch (err) {
                console.error('Background analysis error for doc', id, err);
                await db
                  .update(documentsTable)
                  .set({ status: 'failed' })
                  .where(eq(documentsTable.id, id));
              }
            })();
          }
        }

        return c.json(updatedDocument);
      } catch (error) {
        console.error('Error updating document:', error);
        return c.json({ error: 'Failed to update document' }, 500);
      }
    }
  )
  .patch('/:id/fraud-analysis', protectedRouteMiddleware, async (c) => {
    const { id } = c.req.param();

    try {
      const body = await c.req.json();

      const [updatedDocument] = await db
        .update(documentsTable)
        .set({ fraudAnalysis: body })
        .where(eq(documentsTable.id, id))
        .returning();

      if (!updatedDocument) {
        return c.json({ error: 'Document not found' }, 404);
      }

      return c.json(updatedDocument);
    } catch (error) {
      console.error('Error updating fraud analysis:', error);
      return c.json({ error: 'Failed to update fraud analysis' }, 500);
    }
  })
  .patch(
    '/:id/approve',
    protectedRouteMiddleware,
    zValidator('json', ApprovalSchema),
    async (c) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const { id } = c.req.param();
      const { notes } = c.req.valid('json');

      try {
        const data = await db.transaction(async (tx) => {
          const existing = await tx.query.documentsTable.findFirst({
            where: (item, { eq }) => eq(item.id, id),
          });

          if (!existing) {
            throw new Error('Document not found');
          }

          if (existing.approvalStatus !== 'pending') {
            throw new Error('Document has already been reviewed');
          }

          const [updatedDocument] = await tx
            .update(documentsTable)
            .set({
              approvalStatus: 'approved',
              approvalNotes: notes,
              approvedAt: new Date(),
              approvedBy: user.id,
            })
            .where(eq(documentsTable.id, id))
            .returning();

          if (!updatedDocument) {
            throw new Error('Failed to approve document');
          }

          return updatedDocument;
        });

        return c.json(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to approve document';
        return c.json({ error: message }, 400);
      }
    }
  )
  .patch(
    '/:id/reject',
    protectedRouteMiddleware,
    zValidator('json', ApprovalSchema),
    async (c) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const { id } = c.req.param();
      const { notes } = c.req.valid('json');

      try {
        const data = await db.transaction(async (tx) => {
          const existing = await tx.query.documentsTable.findFirst({
            where: (item, { eq }) => eq(item.id, id),
          });

          if (!existing) {
            throw new Error('Document not found');
          }

          if (existing.approvalStatus !== 'pending') {
            throw new Error('Document has already been reviewed');
          }

          const [updatedDocument] = await tx
            .update(documentsTable)
            .set({
              approvalStatus: 'rejected',
              approvalNotes: notes,
              rejectedAt: new Date(),
              rejectedBy: user.id,
            })
            .where(eq(documentsTable.id, id))
            .returning();

          if (!updatedDocument) {
            throw new Error('Failed to reject document');
          }

          return updatedDocument;
        });

        return c.json(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to reject document';
        return c.json({ error: message }, 400);
      }
    }
  )
  .delete('/:id', protectedRouteMiddleware, async (c) => {
    const { id } = c.req.param();
    try {
      await db.transaction(async (tx) => {
        const existing = await tx.query.documentsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!existing) {
          throw new Error('Document not found');
        }

        await tx.delete(documentsTable).where(eq(documentsTable.id, id));
      });

      return c.json({ message: 'Document deleted successfully' });
    } catch (error) {
      return c.json({ error: 'Failed to delete document' }, 500);
    }
  });
