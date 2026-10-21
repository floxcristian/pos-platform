import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { RuntimeConfig } from '../config/runtime-config.js';
import { SentryErrorReporter } from '../common/observability/sentry-error-reporter.js';

export async function startHttpApplication(
  factory: (config: RuntimeConfig) => Promise<NestFastifyApplication>,
  config: RuntimeConfig,
): Promise<void> {
  const app = await factory(config);
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  try {
    await app.listen(config.port, config.host);
  } catch (error) {
    const reporter = app.get(SentryErrorReporter);
    reporter.captureException(error, { phase: 'startup', code: 'APPLICATION_START_FAILED' });
    try {
      await app.close();
    } catch {
      // Preserve the primary failure even when a shutdown hook fails too.
    } finally {
      await reporter.close();
    }
    throw error;
  }
}
