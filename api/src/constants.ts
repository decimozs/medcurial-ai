export const APP_CONFIG = {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PATCH', 'DELETE', 'PUT'] as const,
    maxAge: 600,
    credentials: true,
  },
} as const;

export const API_VERSION = '/api/v1';

export const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8001';

export const WORKER_API_KEY = process.env.WORKER_API_KEY || '';

export const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
export const WEBHOOK_EMAIL = process.env.WEBHOOK_EMAIL || '';
export const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://hyzaxowpeumvtkfhtdds.supabase.co';
export const SUPABASE_KEY =
  process.env.SUPABASE_KEY || 'sb_publishable_JXFrJ3W7YSK45ymCWN6jAw_Y_0Ts6L9';
