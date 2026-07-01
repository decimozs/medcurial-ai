import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { eq } from 'drizzle-orm';
import { bodyLimit } from 'hono/body-limit';
import {
  AGENT_URL,
  APP_URL,
  SUPABASE_KEY,
  SUPABASE_URL,
  WEBHOOK_EMAIL,
  WEBHOOK_URL,
  WORKER_API_KEY,
} from '@/constants';
import { db } from '@/db';
import { protectedRouteMiddleware } from '@/middlewares/protected';
import { CAP, FIU, requireRole } from '@/middlewares/role';
import {
  ApprovalSchema,
  documentsTable,
  FindingSchema,
  FiuDeterminationSchema,
  InsertDocumentSchema,
  reviewFindingsTable,
  UpdateDocumentSchema,
} from '@/schemas';
import { factory, zValidator } from '@/utils';

function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

const supabase = getSupabaseClient();

const MAX_WEBHOOK_RETRIES = 3;

async function sendWebhook(
  documentId: string,
  intent: 'fraud-investigation' | 'claims-approval',
  document: typeof documentsTable.$inferSelect,
  recipientEmail?: string | null
) {
  if (!WEBHOOK_URL) {
    console.log('Webhook URL not configured, skipping webhook notification');
    return;
  }

  const route = intent === 'fraud-investigation' ? 'fiu' : 'cap';
  const link = `${APP_URL}/${route}/${documentId}`;

  const payload = {
    intent,
    email: recipientEmail || WEBHOOK_EMAIL,
    link,
    document,
  };

  for (let attempt = 1; attempt <= MAX_WEBHOOK_RETRIES; attempt++) {
    try {
      const response = await fetch(`${WEBHOOK_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Webhook sent successfully for document ${documentId}`);
        return;
      }

      console.error(
        `Webhook attempt ${attempt} failed with status ${response.status}`
      );
    } catch (error) {
      console.error(`Webhook attempt ${attempt} error:`, error);
    }

    if (attempt < MAX_WEBHOOK_RETRIES) {
      const delay = 1000 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `Failed to send webhook after ${MAX_WEBHOOK_RETRIES} attempts for document ${documentId}`
  );
}

function determineIntent(
  fraudAnalysis: unknown
): 'fraud-investigation' | 'claims-approval' {
  if (!fraudAnalysis || typeof fraudAnalysis !== 'object') {
    return 'claims-approval';
  }

  const analysis = fraudAnalysis as Record<string, unknown>;
  const auditorResponse =
    (analysis.auditor_response as Record<string, unknown>) ||
    (analysis.raw_response as Record<string, unknown>) ||
    analysis;

  const isFlagged = auditorResponse?.is_flagged_for_review === true;
  return isFlagged ? 'fraud-investigation' : 'claims-approval';
}

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
      with: {
        investigator: true,
        approver: true,
        rejector: true,
        findings: {
          with: {
            user: true,
          },
          orderBy: (findings, { desc }) => [desc(findings.createdAt)],
        },
      },
    });

    if (!data) return c.json({ error: 'Document not found' }, 404);

    return c.json(data);
  })
  .post(
    '/:id/findings',
    protectedRouteMiddleware,
    bodyLimit({ maxSize: 1024 * 1024 }),
    zValidator('json', FindingSchema),
    async (c) => {
      const { id } = c.req.param();
      const body = c.req.valid('json');
      const userSession = c.get('user');

      if (!userSession) return c.json({ error: 'Unauthorized' }, 401);

      try {
        const [newFinding] = await db
          .insert(reviewFindingsTable)
          .values({
            documentId: id,
            userId: userSession.id,
            content: body.content,
            type: body.type,
            status: body.status,
          })
          .returning();

        // Broadcast to Supabase Realtime
        if (supabase) {
          await supabase.channel(`findings:review:${id}`).send({
            type: 'broadcast',
            event: 'INSERT',
            payload: newFinding,
          });
        }

        return c.json(newFinding);
      } catch (error) {
        console.error('Error creating finding:', error);
        return c.json({ error: 'Failed to create finding' }, 500);
      }
    }
  )
  .post(
    '/',
    protectedRouteMiddleware,
    bodyLimit({ maxSize: 1024 * 1024 }),
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
                headers: {
                  'Content-Type': 'application/json',
                  'X-Worker-Key': WORKER_API_KEY,
                },
                body: JSON.stringify({ extracted_text: body.extractedText }),
              });

              if (agentResponse.ok) {
                const fraudAnalysis = await agentResponse.json();
                await db
                  .update(documentsTable)
                  .set({ fraudAnalysis })
                  .where(eq(documentsTable.id, data.id));
              }
            } catch (error) {
              console.error('Error triggering agent:', error);
            }
          })();
        }

        return c.json(data);
      } catch (error) {
        console.error('Error creating document:', error);
        return c.json({ error: 'Failed to create document' }, 500);
      }
    }
  )
  .put(
    '/:id',
    protectedRouteMiddleware,
    bodyLimit({ maxSize: 1024 * 1024 }),
    zValidator('json', UpdateDocumentSchema),
    async (c) => {
      const { id } = c.req.param();
      const body = c.req.valid('json');

      try {
        // Fetch existing document first (before transaction)
        const existingDocument = await db.query.documentsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!existingDocument) {
          return c.json({ error: 'Document not found' }, 404);
        }

        const existingExtractedText = existingDocument.extractedText;

        // Now run the transaction
        const data = await db.transaction(async (tx) => {
          const [updatedDocument] = await tx
            .update(documentsTable)
            .set(body)
            .where(eq(documentsTable.id, id))
            .returning();

          if (!updatedDocument) {
            throw new Error('Failed to update document');
          }

          return updatedDocument;
        });

        if (body.extractedText && AGENT_URL) {
          const existingText = existingExtractedText;
          if (!existingText && body.extractedText) {
            (async () => {
              try {
                const agentResponse = await fetch(`${AGENT_URL}/analyze`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Worker-Key': WORKER_API_KEY,
                  },
                  body: JSON.stringify({ extracted_text: body.extractedText }),
                });

                if (agentResponse.ok) {
                  const fraudAnalysis = await agentResponse.json();
                  const [updatedDocument] = await db
                    .update(documentsTable)
                    .set({ fraudAnalysis })
                    .where(eq(documentsTable.id, id))
                    .returning();

                  if (!updatedDocument) {
                    return c.json({ error: 'Failed to update document' }, 500);
                  }

                  const intent = determineIntent(body);
                  sendWebhook(id, intent, updatedDocument);
                }
              } catch (error) {
                console.error('Error triggering agent from PUT:', error);
              }
            })();
          }
        }

        return c.json(data);
      } catch (error) {
        console.error('Error updating document:', error);
        return c.json({ error: 'Failed to update document' }, 500);
      }
    }
  )
  .patch(
    '/:id/fraud-analysis',
    protectedRouteMiddleware,
    requireRole(FIU),
    bodyLimit({ maxSize: 1024 * 1024 }),
    async (c) => {
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
    }
  )
  .patch(
    '/:id/fiu-determination',
    protectedRouteMiddleware,
    requireRole(FIU),
    zValidator('json', FiuDeterminationSchema),
    async (c) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const { id } = c.req.param();
      const { status, notes } = c.req.valid('json');

      try {
        const data = await db.transaction(async (tx) => {
          const existing = await tx.query.documentsTable.findFirst({
            where: (item, { eq }) => eq(item.id, id),
          });

          if (!existing) {
            throw new Error('Document not found');
          }

          // Relaxing this to allow peer reviews / multiple investigations
          // Previously: if (existing.fiuStatus !== 'pending')

          const [updatedDocument] = await tx
            .update(documentsTable)
            .set({
              fiuStatus: status, // status: 'fraud' | 'not_fraud'
              fiuNotes: notes,
              fiuInvestigatedAt: new Date(),
              fiuInvestigatedBy: user.id,
            })
            .where(eq(documentsTable.id, id))
            .returning();

          if (!updatedDocument) {
            throw new Error('Failed to update FIU determination');
          }

          // Create a formal finding for tracking history
          const [newFinding] = await tx
            .insert(reviewFindingsTable)
            .values({
              documentId: id,
              userId: user.id,
              content: notes,
              type: 'fiu',
              status: status,
            })
            .returning();

          // After FIU investigation, send to CAP for final approval
          // Only send if it's the first time or if requested (keeping logic as is for now)
          await sendWebhook(id, 'claims-approval', updatedDocument);

          return { updatedDocument, newFinding };
        });

        // Broadcast the new determination to Supabase Realtime
        if (supabase) {
          await supabase.channel(`findings:review:${id}`).send({
            type: 'broadcast',
            event: 'INSERT',
            payload: data.newFinding,
          });
        }

        return c.json(data.updatedDocument);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update FIU determination';
        return c.json({ error: message }, 400);
      }
    }
  )
  .patch(
    '/:id/approve',
    protectedRouteMiddleware,
    requireRole(CAP),
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

          // Check if FIU investigation is required and pending
          const intent = determineIntent(existing.fraudAnalysis);
          if (
            intent === 'fraud-investigation' &&
            existing.fiuStatus === 'pending'
          ) {
            throw new Error(
              'Document requires FIU investigation before final approval'
            );
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
  .post(
    '/:id/notify',
    protectedRouteMiddleware,
    bodyLimit({ maxSize: 1024 * 1024 }),
    async (c) => {
      const { id } = c.req.param();
      const { userIds } = await c.req.json();

      try {
        const document = await db.query.documentsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!document) {
          return c.json({ error: 'Document not found' }, 404);
        }

        const recipients = await db.query.user.findMany({
          where: (u, { inArray }) => inArray(u.id, userIds),
        });

        const userSession = c.get('user');
        const intent =
          userSession?.role === 'claims-approval-user'
            ? 'claims-approval'
            : 'fraud-investigation';

        // Send notifications in background
        (async () => {
          for (const recipient of recipients) {
            if (recipient.email) {
              await sendWebhook(id, intent, document, recipient.email);
            }
          }
        })();

        return c.json({
          message: `Notifications sent to ${recipients.length} users`,
        });
      } catch (error) {
        console.error('Error sending notifications:', error);
        return c.json({ error: 'Failed to send notifications' }, 500);
      }
    }
  )
  .patch(
    '/:id/reject',
    protectedRouteMiddleware,
    requireRole(CAP),
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

          // Check if FIU investigation is required and pending
          const intent = determineIntent(existing.fraudAnalysis);
          if (
            intent === 'fraud-investigation' &&
            existing.fiuStatus === 'pending'
          ) {
            throw new Error(
              'Document requires FIU investigation before final approval'
            );
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
  .delete(
    '/:id',
    protectedRouteMiddleware,
    requireRole(FIU, CAP),
    async (c) => {
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
        console.error('Error deleting document:', error);
        return c.json({ error: 'Failed to delete document' }, 500);
      }
    }
  );
