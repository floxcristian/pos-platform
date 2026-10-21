import 'reflect-metadata';
import { Module } from '@nestjs/common';
import type { INestApplicationContext, Type } from '@nestjs/common';
import { ModulesContainer, NestFactory } from '@nestjs/core';
import { Logger, LoggerModule } from 'nestjs-pino';
import { createNestLoggingOptions, createRuntimeLogger } from '../common/observability/runtime-logging.js';
import type { ServiceConfig } from '../config/runtime-config.js';
import { ServiceConfigModule } from '../config/service-config.module.js';
import { ErrorTrackingModule } from '../common/observability/error-tracking.module.js';
import { SentryErrorReporter } from '../common/observability/sentry-error-reporter.js';

@Module({})
class WorkerApplicationModule {}

export interface WorkerInspection {
  readonly service: string;
  readonly mode: 'scaffold';
  readonly processingEnabled: false;
  readonly modules: readonly string[];
}

export async function createWorkerContext(
  rootModule: Type<unknown>,
  config: ServiceConfig,
  reporter = new SentryErrorReporter(config),
): Promise<INestApplicationContext> {
  const logger = createRuntimeLogger(config);
  let app: INestApplicationContext | undefined;
  try {
    app = await NestFactory.createApplicationContext(
      {
        module: WorkerApplicationModule,
        imports: [
          ServiceConfigModule.register(config),
          ErrorTrackingModule.register(reporter),
          LoggerModule.forRoot(createNestLoggingOptions(logger)),
          rootModule,
        ],
      },
      { logger: false, abortOnError: false },
    );
    app.useLogger(app.get(Logger));
    logger.info({ event: 'application.initialized', stage: 'composition' });
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

/** Compile and inspect the real Nest graph, then close; no transport or jobs are started. */
export async function inspectWorker(
  rootModule: Type<unknown>,
  config: ServiceConfig,
): Promise<WorkerInspection> {
  const app = await createWorkerContext(rootModule, config);
  let result: { value: WorkerInspection; failed: false } | { error: unknown; failed: true };
  try {
    const value = await runWorkerOperation(app, () => {
      const modules = [
        ...new Set([...app.get(ModulesContainer).values()].map((module) => module.metatype.name)),
      ].sort();
      app.get(Logger).log({
        event: 'worker.processing.disabled',
        reason: 'Scaffold only: durable storage, delivery and processing are not configured.',
      });
      return Object.freeze({
        service: config.service,
        mode: 'scaffold' as const,
        processingEnabled: false as const,
        modules: Object.freeze(modules),
      });
    });
    result = { value, failed: false };
  } catch (error) {
    result = { error, failed: true };
  }
  const reporter = app.get(SentryErrorReporter);
  try {
    await app.close();
  } catch (error) {
    if (!result.failed) {
      reporter.captureException(error, { phase: 'worker', code: 'WORKER_EXECUTION_FAILED' });
      result = { error, failed: true };
    }
  } finally {
    await reporter.close();
  }
  if (result.failed) throw result.error;
  return result.value;
}

/** Shared failure boundary for worker commands; it does not schedule or retry work. */
export async function runWorkerOperation<T>(
  app: INestApplicationContext,
  operation: () => T | Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    app
      .get(SentryErrorReporter)
      .captureException(error, { phase: 'worker', code: 'WORKER_EXECUTION_FAILED' });
    throw error;
  }
}

export function parseWorkerCommand(args: readonly string[]): 'inspect' | 'check' {
  if (args.length === 0) return 'inspect';
  if (args.length === 1 && (args[0] === 'inspect' || args[0] === 'check')) return args[0];
  throw new Error('Unsupported worker command. Use inspect or check.');
}
