# Integración ERP

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Fachada POS, puertos, ACL y adaptadores AX/Gira/custom; destino fijado por operación y conciliación.

## Propiedad y límites

Intentos, destino y resultados de integración. Un acuse de recepción no es contabilización ERP.

Consumir únicamente la entrada pública `@pos-platform/erp`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

Concentrador, apiMountainPosCaja y servicios de integración corporativos. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
