import { relations } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { baseSchema, excludedFields } from '@/utils';
import { user } from './auth';
import { documentsTable } from './document';

export const reviewFindingsTable = pgTable('review_findings', {
  ...baseSchema,
  documentId: text('document_id')
    .notNull()
    .references(() => documentsTable.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: text('type').notNull(), // 'fiu' | 'cap'
  status: text('status'), // optional: 'fraud', 'not_fraud', 'approved', 'rejected'
});

export const reviewFindingsRelations = relations(
  reviewFindingsTable,
  ({ one }) => ({
    document: one(documentsTable, {
      fields: [reviewFindingsTable.documentId],
      references: [documentsTable.id],
    }),
    user: one(user, {
      fields: [reviewFindingsTable.userId],
      references: [user.id],
    }),
  })
);

export const InsertFindingSchema = createInsertSchema(reviewFindingsTable)
  .omit(excludedFields)
  .strict();

export const FindingSchema = z.object({
  content: z.string().min(1, 'Finding content is required'),
  type: z.enum(['fiu', 'cap']),
  status: z.string().optional(),
});

export type ReviewFinding = typeof reviewFindingsTable.$inferSelect;
export type InsertReviewFinding = z.infer<typeof InsertFindingSchema>;
export type Finding = z.infer<typeof FindingSchema>;
