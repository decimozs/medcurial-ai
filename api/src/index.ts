import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { API_VERSION, APP_CONFIG } from './constants';
import { errorMiddleware, loggerMiddleware } from './middlewares';
import { chatRoutes, documentRoutes, signatureRoutes } from './routes';

const app = new Hono({ strict: false })
  .use('*', loggerMiddleware)
  .use('*', cors(APP_CONFIG.cors as any))
  .use('*', errorMiddleware)
  .basePath(API_VERSION)
  .get('/', (c) => {
    return c.text('Hello from Medcurial API');
  })
  .route('/chat', chatRoutes)
  .route('/signatures', signatureRoutes)
  .route('/documents', documentRoutes);

export default app;
