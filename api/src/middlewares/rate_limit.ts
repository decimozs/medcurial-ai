import type { Context, Next } from 'hono';

interface RateLimitConfig {
  max: number;
  window: number;
}

interface RouteLimit {
  pathMatch: string;
  config: RateLimitConfig;
}

const store = new Map<string, number[]>();
const CLEANUP_INTERVAL = 60000;

let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, timestamps] of store) {
    if (timestamps.length === 0) {
      store.delete(key);
      continue;
    }
    const age = now - (timestamps[timestamps.length - 1] ?? now);
    if (age > 120000) {
      store.delete(key);
    }
  }
}

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

function matchPath(path: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    return path.startsWith(pattern.slice(0, -2));
  }
  return path === pattern;
}

export function createRateLimiter(
  rules: Record<string, RateLimitConfig>,
  defaultConfig: RateLimitConfig
) {
  const routeLimits: RouteLimit[] = Object.entries(rules).map(
    ([pathMatch, config]) => ({ pathMatch, config })
  );

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const path = c.req.path;
    const ip = getClientIp(c);

    let config = defaultConfig;
    for (const rl of routeLimits) {
      if (matchPath(path, rl.pathMatch)) {
        config = rl.config;
        break;
      }
    }

    const key = `${ip}:${path}`;
    const now = Date.now();
    const timestamps = store.get(key) || [];
    const window = config.window * 1000;

    const recent = timestamps.filter((t) => now - t < window);

    if (recent.length >= config.max) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    recent.push(now);
    store.set(key, recent);
    cleanup();

    await next();
  };
}
