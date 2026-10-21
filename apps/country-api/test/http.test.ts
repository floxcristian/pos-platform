import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplication, loadConfig, ReadinessService } from '../src/app.js';

describe('country API composition', () => {
  let app: NestFastifyApplication;
  beforeAll(async () => {
    app = await createApplication(loadConfig({ NODE_ENV: 'test', COUNTRY_API_LOG_LEVEL: 'silent' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('has its own listener settings and ignores branch configuration', () => {
    expect(
      loadConfig({ POS_API_PORT: '9999', POS_API_CORS_ORIGINS: 'https://branch.example.test' }),
    ).toMatchObject({
      service: 'country-api',
      host: '127.0.0.1',
      port: 3001,
      corsOrigins: [],
    });
    expect(loadConfig({ COUNTRY_API_PORT: '3101', NODE_ENV: 'production' })).toMatchObject({
      port: 3101,
      docsEnabled: false,
    });
  });

  it('exposes country identity and the shared HTTP protections', async () => {
    const info = await app.inject({
      method: 'GET',
      url: '/api/v1',
      headers: { 'x-request-id': 'untrusted' },
    });
    expect(info.statusCode).toBe(200);
    expect(info.json()).toEqual({ service: 'country-api', apiVersion: '1', mode: 'foundation' });
    expect(info.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(info.headers['x-correlation-id']).toBe(info.headers['x-request-id']);
    expect((await app.inject({ method: 'GET', url: '/health/ready' })).json()).toEqual({ status: 'ready' });
    const spec = await app.inject({ method: 'GET', url: '/api/openapi.json' });
    expect(spec.json<unknown>()).toMatchObject({
      paths: { '/api/v1': { get: { operationId: 'countryGetInfo' } } },
    });
  });

  it('shares honest readiness and semantic errors during shutdown', async () => {
    app.get(ReadinessService).beforeApplicationShutdown();
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      category: 'TECHNICAL',
      message: 'Service temporarily unavailable',
    });
    expect((await app.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
  });
});
