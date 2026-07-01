import { describe, expect, test } from 'bun:test';

describe('App', () => {
  test('app boots and responds on root', async () => {
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
    const { default: app } = await import('@/index');
    const res = await app.request('/api/v1/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello from Medcurial API');
  });

  test('health endpoint handles missing DB gracefully', async () => {
    process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
    const { default: app } = await import('@/index');
    const res = await app.request('/health');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('degraded');
  });
});
