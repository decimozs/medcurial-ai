import { factory } from '@/utils';

export const protectedRouteMiddleware = factory.createMiddleware(
  async (c, next) => {
    const isWorker = c.get('isWorker');
    const user = c.get('user');

    if (!isWorker && !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  }
);
