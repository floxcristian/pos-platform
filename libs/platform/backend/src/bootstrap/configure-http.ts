import helmet from '@fastify/helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ApiExceptionFilter } from '../common/http/api-exception.filter.js';
import type { RuntimeConfig } from '../config/runtime-config.js';
import type { SentryErrorReporter } from '../common/observability/sentry-error-reporter.js';

export async function configureHttpApplication(
  app: NestFastifyApplication,
  config: RuntimeConfig,
  reporter?: SentryErrorReporter,
): Promise<void> {
  app.setGlobalPrefix('api', { exclude: ['health/live', 'health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(reporter));
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: config.docsEnabled ? ["'self'", "'unsafe-inline'"] : ["'self'"],
        imgSrc: ["'self'", 'data:'],
        upgradeInsecureRequests: config.environment === 'production' ? [] : null,
      },
    },
  });
  if (config.corsOrigins.length > 0) {
    app.enableCors({
      origin: [...config.corsOrigins],
      credentials: false,
      exposedHeaders: ['x-request-id', 'x-correlation-id'],
    });
  }
}
