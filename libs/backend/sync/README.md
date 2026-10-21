# Sincronización

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Outbox/inbox, lotes, acuses, cursores, reintentos, solicitudes manuales y programación por flujo.

## Propiedad y límites

Metadatos de entrega/deduplicación. No modifica directamente tablas comerciales ni sustituye el commit del módulo dueño.

En precios y ofertas, este contexto coordinará transporte, programación y solicitudes manuales; `pricing` conservará validación, aplicación y activación de versiones. Recibir un lote no autoriza marcarlo como aplicado: el acuse durable debe corresponder al commit del efecto receptor y su deduplicación.

Consumir únicamente la entrada pública `@pos-platform/sync`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

mountain-sync-sucursal y mountain-concentrador/api-lectura. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
