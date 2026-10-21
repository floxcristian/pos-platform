import { createHttpApplication } from '@pos-platform/backend';
import type { RuntimeConfig } from '@pos-platform/backend';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

export { ReadinessService } from '@pos-platform/backend';
export { loadConfig } from './config/runtime-config.js';

export function createApplication(config: RuntimeConfig): Promise<NestFastifyApplication> {
  return createHttpApplication(AppModule, config, {
    title: 'POS Platform · API de Sucursal',
    description:
      'Base de la API de sucursal de POS Platform. Expone identidad y disponibilidad del proceso; todavía no conecta persistencia ni integraciones de negocio.',
  });
}

export { SentryErrorReporter } from '@pos-platform/backend';
