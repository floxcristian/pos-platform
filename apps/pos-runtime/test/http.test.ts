import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApplication } from '../src/app.js';
import { loadConfig } from '../src/config/runtime-config.js';
import { ReadinessService } from '@pos-platform/backend';
import { expectApiError } from './assert-api-error.js';

describe('runtime HTTP contract', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication(loadConfig({ NODE_ENV: 'test', POS_API_LOG_LEVEL: 'silent' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('should expose unversioned health and versioned service information', async () => {
    const live = await app.inject({ method: 'GET', url: '/health/live' });
    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    const info = await app.inject({ method: 'GET', url: '/api/v1' });

    expect(live.statusCode).toBe(200);
    expect(live.json()).toEqual({ status: 'ok' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: 'ready' });
    expect(info.statusCode).toBe(200);
    expect(info.json()).toEqual({ service: 'pos-runtime', apiVersion: '1', mode: 'foundation' });
    expect((await app.inject({ method: 'GET', url: '/api/v2' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/api/v1/health/live' })).statusCode).toBe(404);
  });

  it('should issue a unique correlation ID when the caller supplies untrusted IDs', async () => {
    const first = await app.inject({
      method: 'GET',
      url: '/health/live',
      headers: { 'x-request-id': 'untrusted-request-id', 'x-correlation-id': 'untrusted-correlation-id' },
    });
    const second = await app.inject({ method: 'GET', url: '/health/live' });

    expect(first.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.headers['x-correlation-id']).toBe(first.headers['x-request-id']);
    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
    expect(first.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should document stable operations and serve a working Swagger UI with local assets', async () => {
    const spec = await app.inject({ method: 'GET', url: '/api/openapi.json' });
    expect(spec.statusCode).toBe(200);
    const document = spec.json<{
      paths: Record<string, { get: { operationId: string; responses: Record<string, unknown> } }>;
      info: { title: string };
    }>();
    expect(document.info.title).toMatch(/POS/i);
    expect(document.paths['/api/v1'].get.operationId).toBe('runtimeGetInfo');
    expect(document.paths['/health/live'].get.operationId).toBe('healthGetLiveness');
    expect(document.paths['/health/ready'].get.operationId).toBe('healthGetReadiness');
    expect(document.paths['/health/ready'].get.responses['503']).toBeDefined();

    const ui = await app.inject({ method: 'GET', url: '/api/docs' });
    expect(ui.statusCode).toBe(200);
    expect(ui.body).toMatch(/swagger-ui/i);
    const csp = String(ui.headers['content-security-policy']);
    expect(csp).toMatch(/(?:^|;)script-src 'self'(?:;|$)/);
    expect(csp).toMatch(/(?:^|;)style-src 'self' 'unsafe-inline'(?:;|$)/);
    expect(csp).not.toMatch(/upgrade-insecure-requests/);

    const assets = [...ui.body.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
      (match) => new URL(match[1], 'http://localhost/api/docs').pathname,
    );
    expect(assets.some((path) => path.endsWith('.js'))).toBe(true);
    expect(assets.some((path) => path.endsWith('.css'))).toBe(true);
    for (const url of assets) {
      const asset = await app.inject({ method: 'GET', url });
      expect(asset.statusCode, `${url} must be available`).toBe(200);
      expect(asset.headers['content-type']).toMatch(
        url.endsWith('.css') ? /text\/css/ : /(?:application|text)\/javascript/,
      );
      expect(asset.headers['x-content-type-options']).toBe('nosniff');
      expect(asset.body.length).toBeGreaterThan(0);
    }
  });

  it('should return a semantic 404 without reflecting the URL or allowing unspecified origins', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/private-path-canary?token=private-query-canary',
      headers: { origin: 'https://untrusted.example.test' },
    });

    expectApiError(response, 404, {
      code: 'RESOURCE_NOT_FOUND',
      category: 'NOT_FOUND',
      message: 'Resource not found',
    });
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.headers['x-correlation-id']).toBe(response.headers['x-request-id']);
    expect(response.body).not.toContain('canary');
  });
});

it('should stop advertising readiness during shutdown while liveness still responds', async () => {
  const app = await createApplication(
    loadConfig({
      NODE_ENV: 'test',
      POS_API_LOG_LEVEL: 'silent',
      POS_API_DOCS_ENABLED: 'false',
    }),
  );
  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Exercise the lifecycle phase before Fastify closes its listener.
    app.get(ReadinessService).beforeApplicationShutdown();
    const ready = await app.inject({ method: 'GET', url: '/health/ready' });

    expectApiError(ready, 503, {
      code: 'SERVICE_UNAVAILABLE',
      category: 'TECHNICAL',
      message: 'Service temporarily unavailable',
    });
    expect((await app.inject({ method: 'GET', url: '/health/live' })).statusCode).toBe(200);
  } finally {
    await app.close();
  }
});

describe('production exposure', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication(
      loadConfig({
        NODE_ENV: 'production',
        POS_API_LOG_LEVEL: 'silent',
        POS_API_CORS_ORIGINS: 'https://pos.example.test',
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('should not publish documentation when production defaults apply', async () => {
    for (const url of ['/api/docs', '/api/openapi.json']) {
      expect((await app.inject({ method: 'GET', url })).statusCode).toBe(404);
    }
  });

  it('should allow preflight only for an explicitly configured origin', async () => {
    const allowed = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1',
      headers: { origin: 'https://pos.example.test', 'access-control-request-method': 'GET' },
    });
    expect(allowed.statusCode).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('https://pos.example.test');

    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1',
      headers: { origin: 'https://pos.example.test.attacker.test' },
    });
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});
