import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import type { DestinationStream, Logger } from 'pino';
import type { Params } from 'nestjs-pino';
import type { ServiceConfig } from '../../config/runtime-config.js';
import {
  LOG_REDACTION_PATHS,
  safeErrorLogFields,
  serializeLogContext,
  serializeLogError,
} from './log-redaction.js';

export function createRuntimeLogger(config: ServiceConfig, destination?: DestinationStream): Logger {
  return pino(
    {
      level: config.logLevel,
      base: { service: config.service, environment: config.environment },
      // HTTP logs use an allowlist below. Also protect common structured fields.
      redact: {
        paths: LOG_REDACTION_PATHS,
        remove: true,
      },
      serializers: { err: serializeLogError, error: serializeLogError, context: serializeLogContext },
      hooks: {
        logMethod(args, method) {
          const first: unknown = args[0];
          const safeFields = safeErrorLogFields(first);
          if (safeFields) method.call(this, safeFields, 'Operation failed');
          else method.apply(this, args);
        },
      },
    },
    destination,
  );
}

/** Nest and HTTP share one Pino instance; middleware adds request context. */
export function createNestLoggingOptions(logger: Logger): Params {
  return {
    pinoHttp: {
      logger,
      autoLogging: false,
      customAttributeKeys: { reqId: 'requestId' },
      // Fastify assigns a trusted ID before Nest middleware runs.
      genReqId: (request) => request.id,
      customProps: (request) => ({ requestId: request.id, correlationId: request.id }),
      // pino-http otherwise installs its own raw error serializer on the child.
      wrapSerializers: false,
      serializers: {
        req: () => undefined,
        res: () => undefined,
        err: serializeLogError,
        error: serializeLogError,
        context: serializeLogContext,
      },
    },
  };
}

export function registerRequestLogging(server: FastifyInstance, logger: Logger): void {
  server.addHook('onRequest', async (request, reply) => {
    request.raw.id = request.id;
    reply.header('x-request-id', request.id);
    reply.header('x-correlation-id', request.id);
  });
  // Covers parser failures, 404s and Swagger too. pino-http autoLogging is off
  // so each completed request produces exactly one completion entry.
  server.addHook('onResponse', async (request, reply) => {
    const entry = {
      event: 'http.request.completed',
      requestId: request.id,
      correlationId: request.id,
      method: request.method,
      route: request.routeOptions.url ?? 'unmatched',
      statusCode: reply.statusCode,
      durationMs: reply.elapsedTime,
    };
    if (reply.statusCode >= 500) logger.error(entry, 'HTTP request completed');
    else if (reply.statusCode >= 400) logger.warn(entry, 'HTTP request completed');
    else logger.info(entry, 'HTTP request completed');
  });
}
