import 'reflect-metadata';

export { API_TAGS } from './config/api-tags.js';
export { loadRuntimeConfig, loadServiceConfig } from './config/runtime-config.js';
export type {
  RuntimeConfig,
  RuntimeDefinition,
  RuntimeEnvironment,
  RuntimeLogLevel,
  ServiceConfig,
} from './config/runtime-config.js';
export { RuntimeConfigModule, RuntimeConfigService } from './config/runtime-config.module.js';
export { ServiceConfigModule, ServiceConfigService } from './config/service-config.module.js';
export { SentryErrorReporter } from './common/observability/sentry-error-reporter.js';
export type { SentryTransportFactory, FailureContext } from './common/observability/sentry-error-reporter.js';
export type { SentryConfig } from './config/sentry-config.js';
export { ApiErrorDto } from './common/http/api-error.dto.js';
export type { ErrorCategory } from './common/http/api-error.dto.js';
export { configureHttpApplication } from './bootstrap/configure-http.js';
export { createHttpApplication } from './bootstrap/create-http-application.js';
export { startHttpApplication } from './bootstrap/start-http-application.js';
export { reportStartupFailure } from './bootstrap/report-startup-failure.js';
export { ReadinessService } from './health/readiness.service.js';
export {
  createWorkerContext,
  inspectWorker,
  parseWorkerCommand,
  runWorkerOperation,
} from './worker/worker-context.js';
export type { WorkerInspection } from './worker/worker-context.js';
