# Dispositivos

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Contratos de impresión, lectura y diagnóstico; selección de capacidades nativas y adaptadores homologados.

## Propiedad y límites

Trabajos y evidencias técnicas. Aceptado por spooler no demuestra papel impreso.

Consumir únicamente la entrada pública `@pos-platform/devices`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

api-impresion-caja: DTE, cheque frente/dorso y CheckScanner. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
