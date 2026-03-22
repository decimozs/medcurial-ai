import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { baseSchema, excludedFields } from '@/utils';

export const documentsTable = pgTable('documents', {
  ...baseSchema,
  name: text('name').notNull(),
  status: text('status').notNull(),
  imageUrls: jsonb('image_urls').notNull(),
  extractedText: text('extracted_text'),
  fraudAnalysis: jsonb('fraud_analysis'),
});

export const InsertDocumentSchema = createInsertSchema(documentsTable)
  .omit(excludedFields)
  .strict();

export const UpdateDocumentSchema = InsertDocumentSchema.partial();

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = ReturnType<typeof InsertDocumentSchema.parse>;
export type UpdateDocument = ReturnType<typeof UpdateDocumentSchema.parse>;
