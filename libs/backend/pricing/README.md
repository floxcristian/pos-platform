# Precios y ofertas

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Evaluación local con reglas y datos versionados; validación, aplicación y activación de versiones del espejo de precios y ofertas.

## Propiedad y límites

Espejo autorizado de lectura y versión activa. La autoridad del precio corporativo permanece en su fuente.

`pricing` validará y aplicará los datos recibidos, y decidirá cuándo activar una versión completa y consistente. `sync` se encargará del transporte de deltas por eventos, la carga masiva programada y las solicitudes manuales de conciliación, invocando el contrato público de `pricing` sin escribir sus tablas. Estas capacidades están propuestas; el scaffold aún no las ejecuta.

Consumir únicamente la entrada pública `@pos-platform/pricing`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

Mountain/ProductosService, ApiPrecios y mountain-sync-sucursal/SyncPrecios. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
