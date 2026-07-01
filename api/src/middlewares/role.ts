import { factory } from '@/utils';

export const FIU = 'fraud-investigation-user';
export const CAP = 'claims-approval-user';

export function requireRole(...roles: string[]) {
  return factory.createMiddleware(async (c, next) => {
    const user = c.get('user');
    if (!user || !user.role || !roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  });
}
