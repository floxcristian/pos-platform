import { randomUUID } from 'node:crypto';
import { BadRequestException, Controller, Get, Injectable, Module } from '@nestjs/common';
import { getClient, getGlobalScope } from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createHttpApplication,
  createWorkerContext,
  loadRuntimeConfig,
  ReadinessService,
  runWorkerOperation,
  SentryErrorReporter,
  startHttpApplication,
} from '../src/index.js';
import type { SentryTransportFactory } from '../src/index.js';

const definition = { service: 'test-api', envPrefix: 'TEST_API', defaultPort: 3000 };
function config(overrides: NodeJS.ProcessEnv = {}) {
  return loadRuntimeConfig(
    {
      NODE_ENV: 'test',
      TEST_API_LOG_LEVEL: 'silent',
      TEST_API_SENTRY_ENABLED: 'true',
      TEST_API_SENTRY_DSN: 'https://publickey@sentry.example.test/1',
      TEST_API_SENTRY_RELEASE: '0.1.0-test',
      ...overrides,
    },
    definition,
  );
}

function memoryTransport() {
  const events: ErrorEvent[] = [];
  const flush = vi.fn(async () => true);
  const factory: SentryTransportFactory = () => ({
    send: async (envelope) => {
      for (const [header, payload] of envelope[1]) {
        if (header.type === 'event') events.push(payload as ErrorEvent);
      }
      return { statusCode: 200 };
    },
    flush,
  });
  return { factory, events, flush };
}

function privateFailure(): Error {
  const error = new Error('private-message-canary customer@example.test');
  error.stack =
    'Error: private-message-canary\n    at privateFunctionCanary (C:\\Users\\private-path-canary\\app\\handler.ts:17:9)';
  return error;
}

@Controller({ version: '1', path: 'probe' })
class FailureController {
  @Get('failure') fail(): never {
    throw privateFailure();
  }
  @Get('invalid') invalid(): never {
    throw new BadRequestException('private-validation-canary');
  }
}
@Module({ controllers: [FailureController] })
class HttpProbeModule {}

@Injectable()
class BrokenProvider {
  constructor() {
    throw privateFailure();
  }
}
@Module({ providers: [BrokenProvider] })
class BrokenModule {}
@Module({})
class WorkerProbeModule {}

@Injectable()
class BrokenLifecycle {
  onApplicationBootstrap(): never {
    throw new Error('primary-bootstrap-failure');
  }
  onModuleDestroy(): never {
    throw privateFailure();
  }
}
@Module({ providers: [BrokenLifecycle] })
class BrokenLifecycleModule {}

afterEach(() => {
  vi.useRealTimers();
});

describe('explicit Sentry configuration', () => {
  it('does not construct a transport unless reporting is explicitly enabled', async () => {
    const transport = vi.fn();
    const defaults = loadRuntimeConfig({}, definition);
    expect(defaults.sentry).toMatchObject({ enabled: false, dsn: undefined, shutdownTimeoutMs: 2000 });
    const reporter = new SentryErrorReporter(defaults, transport);
    expect(
      reporter.captureException(privateFailure(), { phase: 'startup', code: 'APPLICATION_START_FAILED' }),
    ).toBeUndefined();
    expect(await reporter.close()).toBe(true);
    expect(transport).not.toHaveBeenCalled();
  });

  it.each([
    { TEST_API_SENTRY_ENABLED: 'yes' },
    { TEST_API_SENTRY_DSN: '' },
    { TEST_API_SENTRY_DSN: 'https://key:private-dsn-canary@sentry.example.test/1' },
    { TEST_API_SENTRY_DSN: 'https://key@sentry.example.test/1?token=private-dsn-canary' },
    { TEST_API_SENTRY_RELEASE: 'private-release-canary@email.test' },
    { TEST_API_SENTRY_SHUTDOWN_TIMEOUT_MS: '0' },
    { TEST_API_SENTRY_SHUTDOWN_TIMEOUT_MS: '10001' },
  ])('rejects malformed telemetry settings without exposing their values: %j', (settings) => {
    expect(() => config(settings)).toThrow(/Invalid TEST_API_SENTRY_/);
    try {
      config(settings);
    } catch (error) {
      expect(String(error)).not.toContain('private-');
    }
  });
});

describe('private Sentry client and safe event boundary', () => {
  it('sends one useful sanitized event and closes its own client exactly once', async () => {
    const memory = memoryTransport();
    const clientBefore = getClient();
    const reporter = new SentryErrorReporter(config(), memory.factory);
    const requestId = randomUUID();
    const error = privateFailure();
    getGlobalScope().setUser({ id: 'private-global-user-canary' });
    getGlobalScope().setExtra('payload', 'private-global-payload-canary');
    try {
      reporter.captureException(error, { phase: 'http', code: 'INTERNAL_ERROR', statusCode: 500, requestId });
      reporter.captureException(error, { phase: 'http', code: 'INTERNAL_ERROR', statusCode: 500, requestId });
      expect(await reporter.close()).toBe(true);
      expect(await reporter.close()).toBe(true);
      expect(memory.events).toHaveLength(1);
      expect(memory.flush).toHaveBeenCalledTimes(1);
      expect(getClient()).toBe(clientBefore);
      expect(memory.events[0]).toMatchObject({
        environment: 'test',
        release: '0.1.0-test',
        tags: {
          service: 'test-api',
          phase: 'http',
          code: 'INTERNAL_ERROR',
          requestId,
          correlationId: requestId,
          statusCode: 500,
        },
        exception: {
          values: [
            {
              value: 'An unexpected HTTP server failure occurred.',
              stacktrace: { frames: [{ filename: 'handler.ts', lineno: 17, colno: 9 }] },
            },
          ],
        },
      });
      expect(JSON.stringify(memory.events)).not.toMatch(/private-|Users|customer@example/);
      for (const key of ['user', 'request', 'extra', 'breadcrumbs', 'contexts', 'server_name'])
        expect(memory.events[0]).not.toHaveProperty(key);
    } finally {
      getGlobalScope().clear();
      await reporter.close();
    }
  });

  it('keeps concurrent applications and their correlation IDs isolated', async () => {
    const first = memoryTransport();
    const second = memoryTransport();
    const a = new SentryErrorReporter(config(), first.factory);
    const b = new SentryErrorReporter({ ...config(), service: 'other-api' }, second.factory);
    const requestA = randomUUID();
    const requestB = randomUUID();
    a.captureException(privateFailure(), { phase: 'http', code: 'INTERNAL_ERROR', requestId: requestA });
    b.captureException(privateFailure(), {
      phase: 'worker',
      code: 'WORKER_EXECUTION_FAILED',
      requestId: requestB,
    });
    await Promise.all([a.close(), b.close()]);
    expect(first.events[0].tags).toMatchObject({ service: 'test-api', requestId: requestA });
    expect(second.events[0].tags).toMatchObject({ service: 'other-api', requestId: requestB });
    expect(JSON.stringify(first.events)).not.toContain(requestB);
    expect(JSON.stringify(second.events)).not.toContain(requestA);
  });

  it('bounds shutdown even when a transport fails to settle', async () => {
    vi.useFakeTimers();
    const reporter = new SentryErrorReporter(config(), () => ({
      send: async () => ({ statusCode: 200 }),
      flush: () => new Promise(() => {}),
    }));
    const close = reporter.close();
    await vi.advanceTimersByTimeAsync(2001);
    expect(await close).toBe(false);
    expect(
      reporter.captureException(privateFailure(), { phase: 'worker', code: 'WORKER_EXECUTION_FAILED' }),
    ).toBeUndefined();
  });

  it('does not replace an application failure when its transport rejects shutdown', async () => {
    const reporter = new SentryErrorReporter(config(), () => ({
      send: async () => ({ statusCode: 200 }),
      flush: async () => {
        throw privateFailure();
      },
    }));
    expect(await reporter.close()).toBe(false);
    expect(await reporter.close()).toBe(false);
  });
});

describe('HTTP and worker failure boundaries', () => {
  it('does not replay a failed construction error into a later application logger', async () => {
    const output: string[] = [];
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    const memory = memoryTransport();
    const settings = config({ TEST_API_LOG_LEVEL: 'info' });
    try {
      await expect(
        createHttpApplication(
          BrokenModule,
          settings,
          { title: 'Test', description: 'Test' },
          new SentryErrorReporter(settings, memory.factory),
        ),
      ).rejects.toThrow('private-message-canary');
      const app = await createHttpApplication(
        WorkerProbeModule,
        settings,
        { title: 'Test', description: 'Test' },
        new SentryErrorReporter(settings, memory.factory),
      );
      try {
        await app.init();
      } finally {
        await app.close();
      }
      expect(output.join('')).toContain('application.initialized');
      expect(output.join('')).toContain('RouterExplorer');
      expect(output.join('')).not.toContain('private-');
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });

  it('retains a failed startup when shutdown hooks also fail, and still closes Sentry', async () => {
    const output: string[] = [];
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
    const memory = memoryTransport();
    const settings = config({ TEST_API_LOG_LEVEL: 'info' });
    const reporter = new SentryErrorReporter(settings, memory.factory);
    try {
      const app = await createHttpApplication(
        BrokenLifecycleModule,
        settings,
        { title: 'Test', description: 'Test' },
        reporter,
      );
      await expect(startHttpApplication(async () => app, settings)).rejects.toThrow(
        'primary-bootstrap-failure',
      );
      expect(memory.events).toHaveLength(1);
      expect(memory.events[0].tags?.['phase']).toBe('startup');
      expect(memory.flush).toHaveBeenCalledTimes(1);
      expect(output.join('')).toContain('application.initialized');
      expect(output.join('')).not.toContain('private-');
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });
  it('captures an HTTP 500 with its server ID, excluding validation and expected readiness errors', async () => {
    const memory = memoryTransport();
    const settings = config();
    const reporter = new SentryErrorReporter(settings, memory.factory);
    const app = await createHttpApplication(
      HttpProbeModule,
      settings,
      { title: 'Test', description: 'Test' },
      reporter,
    );
    try {
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/probe/failure?secret=private-query-canary',
        headers: { 'x-request-id': 'private-header-canary' },
      });
      expect(response.statusCode).toBe(500);
      expect((await app.inject({ method: 'GET', url: '/api/v1/probe/invalid' })).statusCode).toBe(400);
      app.get(ReadinessService).beforeApplicationShutdown();
      expect((await app.inject({ method: 'GET', url: '/health/ready' })).statusCode).toBe(503);
      await reporter.flush();
      expect(memory.events).toHaveLength(1);
      expect(memory.events[0].tags?.['requestId']).toBe(response.headers['x-request-id']);
      expect(JSON.stringify(memory.events)).not.toContain('private-');
    } finally {
      await app.close();
    }
  });

  it.each(['http', 'worker'])(
    'captures and closes the client when %s dependency construction fails',
    async (kind) => {
      const memory = memoryTransport();
      const settings = config();
      const reporter = new SentryErrorReporter(settings, memory.factory);
      const build =
        kind === 'http'
          ? createHttpApplication(BrokenModule, settings, { title: 'Test', description: 'Test' }, reporter)
          : createWorkerContext(BrokenModule, settings, reporter);
      await expect(build).rejects.toThrow('private-message-canary');
      expect(memory.events).toHaveLength(1);
      expect(memory.events[0].tags).toMatchObject({ phase: 'startup', code: 'APPLICATION_START_FAILED' });
      expect(memory.flush).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(memory.events)).not.toContain('private-');
    },
  );

  it('captures a worker command failure once and drains it when the context closes', async () => {
    const memory = memoryTransport();
    const settings = config();
    const reporter = new SentryErrorReporter(settings, memory.factory);
    const app = await createWorkerContext(WorkerProbeModule, settings, reporter);
    try {
      await expect(
        runWorkerOperation(app, () => {
          throw privateFailure();
        }),
      ).rejects.toThrow('private-message-canary');
    } finally {
      await app.close();
    }
    expect(memory.events).toHaveLength(1);
    expect(memory.events[0].tags).toMatchObject({ phase: 'worker', code: 'WORKER_EXECUTION_FAILED' });
    expect(memory.flush).toHaveBeenCalledTimes(1);
  });
});
