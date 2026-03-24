import { relations } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { baseSchema, excludedFields } from '@/utils';
import { documentsTable } from './document';

export const chatSessionsTable = pgTable('chat_sessions', {
  ...baseSchema,
  title: text('title').notNull(),
  documentId: text('document_id'),
  userId: text('user_id').notNull(),
});

export const chatMessagesTable = pgTable('chat_messages', {
  id: text('id').notNull().primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => chatSessionsTable.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

export const chatSessionsRelations = relations(
  chatSessionsTable,
  ({ many, one }) => ({
    messages: many(chatMessagesTable),
    document: one(documentsTable, {
      fields: [chatSessionsTable.documentId],
      references: [documentsTable.id],
    }),
  })
);

export const chatMessagesRelations = relations(
  chatMessagesTable,
  ({ one }) => ({
    session: one(chatSessionsTable, {
      fields: [chatMessagesTable.sessionId],
      references: [chatSessionsTable.id],
    }),
  })
);

export const InsertChatSessionSchema = createInsertSchema(chatSessionsTable)
  .omit(excludedFields)
  .strict();

export const InsertChatMessageSchema = createInsertSchema(
  chatMessagesTable
).omit({
  id: true,
  createdAt: true,
});

export const InsertMessageBodySchema = InsertChatMessageSchema.omit({
  sessionId: true,
}).extend({
  llmModel: z.string().optional(),
});

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type InsertChatSession = ReturnType<
  typeof InsertChatSessionSchema.parse
>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type InsertChatMessage = ReturnType<
  typeof InsertChatMessageSchema.parse
>;
export type InsertMessageBody = z.infer<typeof InsertMessageBodySchema>;
