const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export const APP_CONFIG = {
  cors: {
    origin: parseOrigins(process.env.ALLOWED_ORIGINS),
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PATCH', 'DELETE', 'PUT'] as const,
    maxAge: 600,
    credentials: true,
  },
} as const;

export const API_VERSION = '/api/v1';

export const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8001';
export const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8000';

export const WORKER_API_KEY = process.env.WORKER_API_KEY || '';

export const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
export const WEBHOOK_EMAIL = process.env.WEBHOOK_EMAIL || '';
export const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
