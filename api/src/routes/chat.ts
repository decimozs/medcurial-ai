import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { AGENT_URL } from '@/constants';
import { db } from '@/db';
import { protectedRouteMiddleware } from '@/middlewares/protected';
import {
  chatMessagesTable,
  chatSessionsTable,
  InsertMessageBodySchema,
} from '@/schemas/chat';
import { factory, zValidator } from '@/utils';

function generateTitle(content: string): string {
  const maxLength = 50;
  if (content.length <= maxLength) {
    return content;
  }
  return `${content.substring(0, maxLength)}...`;
}

function buildChatHistory(messages: { role: string; content: string }[]) {
  return messages
    .map(
      (msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    )
    .join('\n');
}

export const chatRoutes = factory
  .createApp()
  .get('/', protectedRouteMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const userId = user.id;
    const documentId = c.req.query('documentId');

    const sessions = await db.query.chatSessionsTable.findMany({
      where: (item, { eq, and }) => {
        const userFilter = eq(item.userId, userId);
        if (documentId) {
          return and(userFilter, eq(item.documentId, documentId));
        }
        return userFilter;
      },
      orderBy: (item, { desc }) => [desc(item.createdAt)],
    });

    return c.json(sessions);
  })
  .get('/search', protectedRouteMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const userId = user.id;
    const q = c.req.query('q');
    if (!q) return c.json({ sessions: [], messages: [] });

    try {
      const sessions = await db.query.chatSessionsTable.findMany({
        where: (item, { ilike, and, eq }) =>
          and(ilike(item.title, `%${q}%`), eq(item.userId, userId)),
        limit: 5,
      });

      const sessionIds = sessions.map((s) => s.id);
      let messages: (typeof chatMessagesTable.$inferSelect & {
        session?: typeof chatSessionsTable.$inferSelect;
      })[] = [];

      if (sessionIds.length > 0) {
        messages = await db.query.chatMessagesTable.findMany({
          where: (item, { ilike, inArray, and }) =>
            and(
              ilike(item.content, `%${q}%`),
              inArray(item.sessionId, sessionIds)
            ),
          limit: 10,
          with: {
            session: true,
          },
        });
      }

      return c.json({ sessions, messages });
    } catch (error) {
      console.error('Error searching chats:', error);
      return c.json({ error: 'Failed to search chats' }, 500);
    }
  })
  .get('/:id', protectedRouteMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const userId = user.id;
    const { id } = c.req.param();

    const session = await db.query.chatSessionsTable.findFirst({
      where: (item, { eq }) => eq(item.id, id),
      with: {
        document: true,
      },
    });

    if (!session) {
      return c.json({ error: 'Chat session not found' }, 404);
    }

    if (session.userId !== userId) {
      return c.json({ error: 'Chat session not found' }, 404);
    }

    const messages = await db.query.chatMessagesTable.findMany({
      where: (item, { eq }) => eq(item.sessionId, id),
      orderBy: (item, { asc }) => [asc(item.createdAt)],
    });

    return c.json({ session, messages });
  })
  .post('/', protectedRouteMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const [session] = await db
        .insert(chatSessionsTable)
        .values({
          userId: user.id,
          title: body.title || 'New Chat',
          documentId: body.documentId || null,
        })
        .returning();

      if (!session) {
        return c.json({ error: 'Failed to create chat session' }, 500);
      }

      return c.json(session);
    } catch (error) {
      console.error('Error creating chat session:', error);
      return c.json({ error: 'Failed to create chat session' }, 500);
    }
  })
  .post(
    '/:id/messages',
    protectedRouteMiddleware,
    zValidator('json', InsertMessageBodySchema),
    async (c) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      const userId = user.id;
      const { id } = c.req.param();
      const body = c.req.valid('json');

      try {
        const session = await db.query.chatSessionsTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!session) {
          return c.json({ error: 'Chat session not found' }, 404);
        }

        if (session.userId !== userId) {
          return c.json({ error: 'Chat session not found' }, 404);
        }

        const [userMessage] = await db
          .insert(chatMessagesTable)
          .values({
            id: nanoid(),
            sessionId: id,
            role: body.role,
            content: body.content,
            createdAt: new Date().toISOString(),
          })
          .returning();

        const allMessages = await db.query.chatMessagesTable.findMany({
          where: (item, { eq }) => eq(item.sessionId, id),
          orderBy: (item, { asc }) => [asc(item.createdAt)],
        });

        const chatHistory = buildChatHistory(
          allMessages.map((m) => ({ role: m.role, content: m.content }))
        );

        const isFirstMessage =
          allMessages.filter((m) => m.role === 'user').length === 1;

        let assistantResponseText = '';

        try {
          let documentContext: {
            name?: string;
            extractedText?: string | null;
            fraudAnalysis?: Record<string, unknown> | null;
          } | null = null;

          if (session.documentId) {
            const documentId = session.documentId;
            const document = await db.query.documentsTable.findFirst({
              where: (item, { eq }) => eq(item.id, documentId),
            });

            if (document) {
              documentContext = {
                name: document.name,
                extractedText: document.extractedText,
                fraudAnalysis: document.fraudAnalysis as Record<
                  string,
                  unknown
                > | null,
              };
            }
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (body.llmModel) {
            headers['X-LLM-Model'] = body.llmModel;
          }

          const agentResponse = await fetch(`${AGENT_URL}/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: body.content,
              documentId: session.documentId,
              documentContext,
              chatHistory,
            }),
          });

          if (agentResponse.ok) {
            try {
              const agentData = (await agentResponse.json()) as {
                response?: string;
                message?: string;
              };
              assistantResponseText =
                agentData.response || agentData.message || '';
            } catch (jsonError) {
              console.error('Error parsing agent JSON:', jsonError);
              assistantResponseText =
                'Error: Received invalid response from AI agent.';
            }
          } else {
            console.error('Agent response not ok:', agentResponse.status);
            const errorText = await agentResponse
              .text()
              .catch(() => 'No error body');
            console.error('Agent error body:', errorText);
            assistantResponseText =
              'Sorry, I could not process your request at this time.';
          }
        } catch (agentError) {
          console.error('Error calling agent:', agentError);
          assistantResponseText =
            'Sorry, I could not process your request at this time.';
        }

        const [assistantMessage] = await db
          .insert(chatMessagesTable)
          .values({
            id: nanoid(),
            sessionId: id,
            role: 'assistant',
            content: assistantResponseText,
            createdAt: new Date().toISOString(),
          })
          .returning();

        if (isFirstMessage && userMessage) {
          let newTitle = generateTitle(userMessage.content);

          try {
            const titleResponse = await fetch(`${AGENT_URL}/chat/title`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: userMessage.content }),
            });

            if (titleResponse.ok) {
              try {
                const titleData = (await titleResponse.json()) as {
                  title?: string;
                };
                if (titleData.title) {
                  newTitle = titleData.title;
                }
              } catch (e) {}
            }
          } catch (titleError) {
            console.error('Error generating title:', titleError);
          }

          await db
            .update(chatSessionsTable)
            .set({ title: newTitle, updatedAt: new Date() })
            .where(eq(chatSessionsTable.id, id));
        } else {
          await db
            .update(chatSessionsTable)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessionsTable.id, id));
        }

        return c.json(assistantMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        return c.json(
          {
            error: 'Failed to send message',
            details: error instanceof Error ? error.message : String(error),
          },
          500
        );
      }
    }
  )
  .delete('/:id', protectedRouteMiddleware, async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const userId = user.id;
    const { id } = c.req.param();

    try {
      const session = await db.query.chatSessionsTable.findFirst({
        where: (item, { eq }) => eq(item.id, id),
      });

      if (!session) {
        return c.json({ error: 'Chat session not found' }, 404);
      }

      if (session.userId !== userId) {
        return c.json({ error: 'Chat session not found' }, 404);
      }

      await db
        .delete(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, id));
      await db.delete(chatSessionsTable).where(eq(chatSessionsTable.id, id));

      return c.json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return c.json({ error: 'Failed to delete chat session' }, 500);
    }
  });
