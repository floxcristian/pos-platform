import { describe, expect, it } from 'vitest';
import { Logger, PinoLogger } from 'nestjs-pino';
import {
  createNestLoggingOptions,
  createRuntimeLogger,
} from '../src/common/observability/runtime-logging.js';
import { loadServiceConfig } from '../src/config/runtime-config.js';

function setupLogger() {
  const lines: string[] = [];
  const logger = createRuntimeLogger(
    loadServiceConfig({ NODE_ENV: 'test' }, { service: 'logging-test', envPrefix: 'TEST' }),
    {
      write: (line: string) => {
        lines.push(line);
      },
    },
  );
  return { logger, lines };
}

describe('structured Pino logging', () => {
  it('redacts credentials and personal data at supported nesting depths while retaining operational context', () => {
    const { logger, lines } = setupLogger();
    logger.info(
      {
        event: 'operation.completed',
        requestId: 'trusted-request-id',
        correlationId: 'trusted-request-id',
        durationMs: 12,
        password: 'canary-password',
        authorization: 'canary-authorization',
        'set-cookie': 'canary-cookie',
        sentryDsn: 'canary-dsn',
        customer: { email: 'canary-email', rut: 'canary-rut' },
        provider: { credentials: { apiKey: 'canary-api-key' } },
        payment: { card: { pan: 'canary-pan', cvv: 'canary-cvv' } },
        request: { url: '/canary-path', body: 'canary-body' },
        providerResponse: { response: { data: 'canary-provider-response' } },
      },
      'Operation completed',
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('canary');
    expect(JSON.parse(lines[0] ?? '') as unknown).toMatchObject({
      service: 'logging-test',
      environment: 'test',
      event: 'operation.completed',
      requestId: 'trusted-request-id',
      correlationId: 'trusted-request-id',
      durationMs: 12,
      msg: 'Operation completed',
    });
  });

  it('does not serialize raw exception messages, stack or cause in either error field', () => {
    const { logger, lines } = setupLogger();
    const error = new Error('canary-error-message', { cause: new Error('canary-cause') });
    logger.error({ err: error, error }, 'Operation failed');
    expect(lines[0]).not.toContain('canary');
    expect(JSON.parse(lines[0] ?? '') as unknown).toMatchObject({
      err: { type: 'Error' },
      error: { type: 'Error' },
      msg: 'Operation failed',
    });
  });

  it('uses the configured log level and preserves child request context', () => {
    const { logger, lines } = setupLogger();
    logger.debug({ event: 'debug.event' });
    logger.child({ requestId: 'request-42', correlationId: 'request-42' }).warn({ event: 'operation.retry' });
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? '') as unknown).toMatchObject({
      level: 40,
      event: 'operation.retry',
      requestId: 'request-42',
      correlationId: 'request-42',
    });
  });

  it('protects Nest exception overloads after pino-http creates its child logger', () => {
    const { logger, lines } = setupLogger();
    const options = createNestLoggingOptions(logger);
    const nestLogger = new Logger(new PinoLogger(options), options);
    const error = new Error('canary-framework-message');
    error.stack = 'Error: canary-framework-message\n    at action (/canary-owner/application.js:42:7)';
    nestLogger.error(error, error.stack);
    nestLogger.error(error.message, error.stack, 'ExceptionsHandler');
    expect(lines).toHaveLength(2);
    expect(lines.join('')).not.toContain('canary');
    expect(JSON.parse(lines[0] ?? '') as unknown).toMatchObject({
      event: 'application.error',
      context: 'Application',
      err: { type: 'Error' },
      msg: 'Operation failed',
    });
    expect(JSON.parse(lines[1] ?? '') as unknown).toMatchObject({ context: 'ExceptionsHandler' });
  });
});
