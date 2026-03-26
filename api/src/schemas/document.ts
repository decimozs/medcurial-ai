import { relations } from 'drizzle-orm';
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { baseSchema, excludedFields } from '@/utils';
import { user } from './auth';
import { reviewFindingsTable } from './finding';

export const documentsTable = pgTable('documents', {
  ...baseSchema,
  name: text('name').notNull(),
  status: text('status').notNull(),
  imageUrls: jsonb('image_urls').notNull(),
  extractedText: text('extracted_text'),
  fraudAnalysis: jsonb('fraud_analysis'),
  approvalStatus: text('approval_status').notNull().default('pending'),
  approvalNotes: text('approval_notes'),
  approvedAt: timestamp('approved_at'),
  rejectedAt: timestamp('rejected_at'),
  approvedBy: text('approved_by'),
  rejectedBy: text('rejected_by'),
  fiuStatus: text('fiu_status').notNull().default('pending'),
  fiuNotes: text('fiu_notes'),
  fiuInvestigatedAt: timestamp('fiu_investigated_at'),
  fiuInvestigatedBy: text('fiu_investigated_by'),
});

export const documentsRelations = relations(
  documentsTable,
  ({ one, many }) => ({
    investigator: one(user, {
      fields: [documentsTable.fiuInvestigatedBy],
      references: [user.id],
    }),
    approver: one(user, {
      fields: [documentsTable.approvedBy],
      references: [user.id],
    }),
    rejector: one(user, {
      fields: [documentsTable.rejectedBy],
      references: [user.id],
    }),
    findings: many(reviewFindingsTable),
  })
);

export const InsertDocumentSchema = createInsertSchema(documentsTable)
  .omit(excludedFields)
  .strict();

export const UpdateDocumentSchema = InsertDocumentSchema.partial();

export const ApprovalSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});

export const FiuDeterminationSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  status: z.enum(['fraud', 'not_fraud']),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = ReturnType<typeof InsertDocumentSchema.parse>;
export type UpdateDocument = ReturnType<typeof UpdateDocumentSchema.parse>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type FiuDetermination = z.infer<typeof FiuDeterminationSchema>;
