import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '@/db';
import {
  InsertSignatureSchema,
  signaturesTable,
  UpdateSignatureSchema,
} from '@/schemas';
import { zValidator } from '@/utils';

export const signatureRoutes = new Hono()
  .get('/', async (c) => {
    const data = await db.query.signaturesTable.findMany({
      orderBy: (item, { desc }) => [desc(item.createdAt)],
    });

    return c.json(data);
  })
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const data = await db.query.signaturesTable.findFirst({
      where: (item, { eq }) => eq(item.id, id),
    });

    if (!data) {
      return c.json({ error: 'Signature not found' }, 404);
    }

    return c.json(data);
  })
  .post('/', zValidator('json', InsertSignatureSchema), async (c) => {
    const body = c.req.valid('json');
    try {
      const [data] = await db.insert(signaturesTable).values(body).returning();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to create signature' }, 500);
    }
  })
  .put(
    '/:id',
    zValidator('json', UpdateSignatureSchema.partial()),
    async (c) => {
      const { id } = c.req.param();
      const body = c.req.valid('json');
      try {
        const data = await db.transaction(async (tx) => {
          const existing = await tx.query.signaturesTable.findFirst({
            where: (item, { eq }) => eq(item.id, id),
          });

          if (!existing) {
            throw new Error('Signature not found');
          }

          const [updatedSignature] = await tx
            .update(signaturesTable)
            .set(body)
            .where(eq(signaturesTable.id, id))
            .returning();

          if (!updatedSignature) {
            throw new Error('Failed to update signature');
          }

          return updatedSignature;
        });

        return c.json(data);
      } catch (error) {
        return c.json({ error: 'Failed to update signature' }, 500);
      }
    }
  )
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    try {
      await db.transaction(async (tx) => {
        const existing = await tx.query.signaturesTable.findFirst({
          where: (item, { eq }) => eq(item.id, id),
        });

        if (!existing) {
          throw new Error('Signature not found');
        }

        await tx.delete(signaturesTable).where(eq(signaturesTable.id, id));
      });

      return c.json({ message: 'Signature deleted successfully' });
    } catch (error) {
      return c.json({ error: 'Failed to delete signature' }, 500);
    }
  });
