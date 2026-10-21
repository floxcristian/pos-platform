# Administración y operación

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Identidad/autorización, módulos, políticas, sucursales, cajas, configuración, auditoría y diagnóstico.

## Propiedad y límites

Configuración versionada y trazabilidad. Las políticas se verifican en comandos y servidor, no solo en menús.

Consumir únicamente la entrada pública `@pos-platform/administration`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

Usuarios/permisos de Mountain y operación de sincronización/configuración de la propuesta. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
