import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  baseURL: 'http://localhost:3000',
  basePath: '/api/v1/auth',
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  trustedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  advanced: {
    cookiePrefix: 'medcurial_auth',
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});
