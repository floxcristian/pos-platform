import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger, LoggerModule } from 'nestjs-pino';
import {
  createNestLoggingOptions,
  createRuntimeLogger,
  registerRequestLogging,
} from '../common/observability/runtime-logging.js';
import { RuntimeConfigModule } from '../config/runtime-config.module.js';
import type { RuntimeConfig } from '../config/runtime-config.js';
import { HealthModule } from '../health/health.module.js';
import { ErrorTrackingModule } from '../common/observability/error-tracking.module.js';
import { SentryErrorReporter } from '../common/observability/sentry-error-reporter.js';
import { configureHttpApplication } from './configure-http.js';
import { configureOpenApi } from './configure-openapi.js';
import type { OpenApiMetadata } from './configure-openapi.js';

@Module({})
class HttpApplicationModule {}

/** Compose infrastructure around the app's modules without importing another app. */
export async function createHttpApplication(
  rootModule: Type<unknown>,
  config: RuntimeConfig,
  openApi: OpenApiMetadata,
  reporter = new SentryErrorReporter(config),
): Promise<NestFastifyApplication> {
  const logger = createRuntimeLogger(config);
  const adapter = new FastifyAdapter({
    logger: false,
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    bodyLimit: 1024 * 1024,
    requestTimeout: 30_000,
  });
  registerRequestLogging(adapter.getInstance(), logger);
  let app: NestFastifyApplication | undefined;
  try {
    app = await NestFactory.create<NestFastifyApplication>(
      {
        module: HttpApplicationModule,
        imports: [
          RuntimeConfigModule.register(config),
          ErrorTrackingModule.register(reporter),
          LoggerModule.forRoot(createNestLoggingOptions(logger)),
          HealthModule,
          rootModule,
        ],
      },
      adapter,
      { logger: false, abortOnError: false },
    );
    app.useLogger(app.get(Logger));
    logger.info({ event: 'application.initialized', stage: 'composition' });
    await configureHttpApplication(app, config, reporter);
    if (config.docsEnabled) configureOpenApi(app, openApi);
    return app;
  } catch (error) {
    reporter.captureException(error, { phase: 'startup', code: 'APPLICATION_START_FAILED' });
    try {
      await app?.close();
    } catch {
      // Cleanup must not replace the startup failure already captured above.
    } finally {
      await reporter.close();
    }
    throw error;
  }
}
