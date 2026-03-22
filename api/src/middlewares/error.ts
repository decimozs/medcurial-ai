import type { Context, Next } from 'hono';

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error('Error:', error);

    return c.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      500
    );
  }
}
