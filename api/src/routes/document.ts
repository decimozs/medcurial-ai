import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { AGENT_URL } from '@/constants';
import { db } from '@/db';
import {
  documentsTable,
  InsertDocumentSchema,
  UpdateDocumentSchema,
} from '@/schemas';
import { zValidator } from '@/utils';

export const documentRoutes = new Hono()
  .get('/', async (c) => {
    const data = await db.query.documentsTable.findMany({
      orderBy: (item, { desc }) => [desc(item.createdAt)],
    });

    return c.json(data);
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const data = await db.query.documentsTable.findFirst({
      where: (item, { eq }) => eq(item.id, id),
    });

    if (!data) {
      return c.json({ error: 'Document not found' }, 404);
    }

    return c.json(data);
  })
  .post('/', zValidator('json', InsertDocumentSchema), async (c) => {
    const body = c.req.valid('json');

    try {
      const [data] = await db.insert(documentsTable).values(body).returning();

      if (!data) {
        return c.json({ error: 'Failed to create document' }, 500);
      }

      if (body.extractedText) {
        try {
          const agentResponse = await fetch(`${AGENT_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extracted_text: body.extractedText }),
          });

          if (agentResponse.ok) {
            const fraudAnalysis = await agentResponse.json();

            const [updatedData] = await db
              .update(documentsTable)
              .set({ fraudAnalysis })
              .where(eq(documentsTable.id, data.id))
              .returning();

            if (!updatedData) {
              return c.json(data);
            }

            return c.json(updatedData);
          }
        } catch (agentError) {
          console.error('Error calling agent:', agentError);
        }
      }

      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to create document' }, 500);
    }
  })
  .put('/:id', zValidator('json', UpdateDocumentSchema), async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const hasExtractedText = body.extractedText !== undefined;

    try {
      const data = await db.transaction(async (tx) => {
        const existing = await tx.query.documentsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!existing) {
          throw new Error('Document not found');
        }

        const [updatedDocument] = await tx
          .update(documentsTable)
          .set(body)
          .where(eq(documentsTable.id, id))
          .returning();

        if (!updatedDocument) {
          throw new Error('Failed to update document');
        }

        if (hasExtractedText && body.extractedText) {
          try {
            const agentResponse = await fetch(`${AGENT_URL}/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ extracted_text: body.extractedText }),
            });

            if (agentResponse.ok) {
              const fraudAnalysis = await agentResponse.json();

              const [finalDocument] = await tx
                .update(documentsTable)
                .set({ fraudAnalysis })
                .where(eq(documentsTable.id, id))
                .returning();

              return finalDocument;
            }
          } catch (agentError) {
            console.error('Error calling agent:', agentError);
          }
        }

        return updatedDocument;
      });

      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to update document' }, 500);
    }
  })
  .patch('/:id/fraud-analysis', async (c) => {
    const { id } = c.req.param();

    try {
      const body = await c.req.json();

      const data = await db.transaction(async (tx) => {
        const existing = await tx.query.documentsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!existing) {
          throw new Error('Document not found');
        }

        const [updatedDocument] = await tx
          .update(documentsTable)
          .set({ fraudAnalysis: body })
          .where(eq(documentsTable.id, id))
          .returning();

        if (!updatedDocument) {
          throw new Error('Failed to update fraud analysis');
        }

        return updatedDocument;
      });

      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to update fraud analysis' }, 500);
    }
  })
  .delete('/:id', async (c) => {
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
