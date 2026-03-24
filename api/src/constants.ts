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
