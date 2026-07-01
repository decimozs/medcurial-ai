import type { Context, Next } from 'hono';

const isProduction = process.env.NODE_ENV === 'production';

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error('Error:', error);

    const message =
      error instanceof Error && !isProduction
        ? error.message
        : 'Internal Server Error';

    return c.json({ error: message }, 500);
  }
}
