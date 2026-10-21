import { inspectWorker, parseWorkerCommand } from '@pos-platform/backend';
import type { ServiceConfig, WorkerInspection } from '@pos-platform/backend';
import { AppModule } from './app.module.js';

export { loadConfig } from './config/worker-config.js';

export async function runWorkerCommand(
  args: readonly string[],
  config: ServiceConfig,
): Promise<WorkerInspection> {
  parseWorkerCommand(args);
  return inspectWorker(AppModule, config);
}

export { SentryErrorReporter } from '@pos-platform/backend';
