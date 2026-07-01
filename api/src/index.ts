import { honoLogLayer } from '@loglayer/hono';
import {
  getSimplePrettyTerminal,
  moonlight,
} from '@loglayer/transport-simple-pretty-terminal';
import { sql } from 'drizzle-orm';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import { LogLayer } from 'loglayer';
import { serializeError } from 'serialize-error';
import { db } from '@/db';
import { auth } from './auth';
import { API_VERSION, APP_CONFIG, WORKER_API_KEY } from './constants';
import { createRateLimiter, errorMiddleware } from './middlewares';
import {
  chatRoutes,
  documentRoutes,
  signatureRoutes,
  userRoutes,
} from './routes';
import { factory } from './utils';

const log = new LogLayer({
  errorSerializer: serializeError,
  transport: getSimplePrettyTerminal({
    runtime: 'node',
    theme: moonlight,
  }),
});

const app = factory
  .createApp()
  .use(
    honoLogLayer({
      instance: log,
      autoLogging: {
        request: { logLevel: 'debug' },
        response: { logLevel: 'info' },
      },
    })
  )
  .use('*', cors(APP_CONFIG.cors as any))
  .use('*', csrf({ origin: APP_CONFIG.cors.origin as string[] }))
  .use('*', errorMiddleware)
  .use(
    '*',
    secureHeaders({
      xFrameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    })
  )
  .use(
    '*',
    createRateLimiter(
      {
        '/auth/*': { max: 10, window: 60 },
        '/documents/*': { max: 60, window: 60 },
        '/chat/*': { max: 30, window: 60 },
        '/session': { max: 30, window: 60 },
      },
      { max: 100, window: 60 }
    )
  )
  .use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }
    c.set('user', session.user);
    c.set('session', session.session);
    await next();
  })
  .use('*', async (c, next) => {
    const method = c.req.method;
    const path = c.req.path;
    const isWorkerRoute =
      (method === 'POST' || method === 'PUT') &&
      (path.startsWith(`${API_VERSION}/signatures`) ||
        path.startsWith(`${API_VERSION}/documents`));

    if (isWorkerRoute) {
      const workerKey = c.req.header('X-Worker-Key');
      if (workerKey && workerKey === WORKER_API_KEY) {
        c.set('isWorker', true);
        await next();
        return;
      }
    }

    await next();
  })
  .get('/health', async (c) => {
    try {
      await db.execute(sql`SELECT 1`);
      return c.json({ status: 'healthy', db: 'ok' });
    } catch {
      return c.json({ status: 'degraded', db: 'error' }, 503);
    }
  })
  .basePath(API_VERSION)
  .on(['POST', 'GET'], '/auth/*', (c) => auth.handler(c.req.raw))
  .get('/', (c) => {
    return c.text('Hello from Medcurial API');
  })
  .get('/session', (c) => {
    const session = c.get('session');
    const user = c.get('user');

    if (!user) return c.body(null, 401);

    return c.json({
      session,
      user,
    });
  })
  .route('/chat', chatRoutes)
  .route('/signatures', signatureRoutes)
  .route('/users', userRoutes)
  .route('/documents', documentRoutes);

export default app;
