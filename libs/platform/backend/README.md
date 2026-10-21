# Base técnica del backend

**Estado: base técnica implementada.** Librería fuente Nx compartida por `branch-api`, `country-api`, `branch-sync-worker` y `erp-worker`. Su entrada pública es `@pos-platform/backend`; cada aplicación conserva su identidad, configuración y composición de módulos.

## Responsabilidad

- Crear aplicaciones Nest/Fastify, configurar HTTP y OpenAPI, abrir el listener y gestionar el cierre.
- Validar configuración al arrancar y exponer snapshots inmutables mediante `RuntimeConfigService` para HTTP y `ServiceConfigService` para procesos sin listener.
- Unificar logging Pino, correlación HTTP, contrato de errores y sondas de la aplicación.
- Reportar fallos inesperados a Sentry mediante un cliente privado por aplicación, eventos sanitizados y cierre acotado. Se habilita explícitamente por configuración; no instala instrumentación global.
- Crear, inspeccionar y cerrar contextos Nest de workers. La inspección devuelve `processingEnabled: false`: no inicia colas, planificadores ni trabajos de negocio.

## Límites

No contiene reglas comerciales, autenticación, persistencia, transacciones, clientes ERP ni adaptadores de pagos. No importa aplicaciones ni contextos de negocio; recibe el módulo raíz de cada aplicación. Las sondas actuales verifican el proceso y su inicialización, no la disponibilidad de PostgreSQL o integraciones externas.

Los contratos de intercambio pertenecen a `@pos-platform/contracts` y los tipos y perfiles puros a `@pos-platform/shared-kernel` y `@pos-platform/country-policies`. Esas librerías no dependen de esta base Nest/Fastify ni habilitan capacidades comerciales por sí mismas.

## Compilación y comprobaciones

Las aplicaciones empaquetan esta librería fuente mediante Rspack/SWC y el plugin oficial de Nx; no se publica como un paquete independiente. TSC comprueba tipos y Vitest/SWC prueba el comportamiento. `npm run backend:check`, `npm run structure:check` y `npm run backend:smoke` verifican el conjunto y sus artefactos aislados.

Consultar [configuración y contratos HTTP](../../../docs/api.md) y [responsabilidades del monorepo](../../../docs/monorepo.md).
