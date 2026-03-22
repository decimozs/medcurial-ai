import { zValidator as zv } from '@hono/zod-validator';
import { serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { ValidationTargets } from 'hono';
import { nanoid } from 'nanoid';
import type { ZodObject, ZodSchema } from 'zod';

export const baseSchema = {
  id: text('id')
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  no: serial('no'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
} as const;

export const excludedFields = {
  id: true,
  createdAt: true,
  updatedAt: true,
  no: true,
} as const satisfies Partial<Record<keyof ZodObject['shape'], true>>;

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new Error(result.error.message);
    }
  });
