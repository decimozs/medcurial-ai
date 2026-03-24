import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { baseSchema, excludedFields } from '@/utils';

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
});

export const InsertDocumentSchema = createInsertSchema(documentsTable)
  .omit(excludedFields)
  .strict();

export const UpdateDocumentSchema = InsertDocumentSchema.partial();

export const ApprovalSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = ReturnType<typeof InsertDocumentSchema.parse>;
export type UpdateDocument = ReturnType<typeof UpdateDocumentSchema.parse>;
export type Approval = z.infer<typeof ApprovalSchema>;
