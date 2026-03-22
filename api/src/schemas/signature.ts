import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { baseSchema, excludedFields } from '@/utils';

export const signaturesTable = pgTable('signatures', {
  ...baseSchema,
  name: text('name').notNull(),
  status: text('status').notNull(),
  imageUrls: jsonb('image_urls').notNull(),
});

export const InsertSignatureSchema = createInsertSchema(signaturesTable)
  .omit(excludedFields)
  .strict();

export const UpdateSignatureSchema = InsertSignatureSchema.partial();

export type Signature = typeof signaturesTable.$inferSelect;
export type InsertSignature = ReturnType<typeof InsertSignatureSchema.parse>;
export type UpdateSignature = ReturnType<typeof UpdateSignatureSchema.parse>;
