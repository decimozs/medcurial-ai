import { db } from '@/db';
import { protectedRouteMiddleware } from '@/middlewares/protected';
import { factory } from '@/utils';

export const userRoutes = factory
  .createApp()
  .get('/', protectedRouteMiddleware, async (c) => {
    const userSession = c.get('user') as { id: string; role: string | null };
    if (!userSession) return c.json({ error: 'Unauthorized' }, 401);

    const data = await db.query.user.findMany({
      where: (u, { and, eq, ne }) =>
        and(
          userSession.role ? eq(u.role, userSession.role) : undefined,
          ne(u.id, userSession.id)
        ),
      columns: {
        id: true,
        name: true,
        image: true,
        role: true,
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    return c.json(data);
  });
