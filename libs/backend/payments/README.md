# Pagos

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Intentos de pago, pagos mixtos, conciliación y resultados inciertos, referencias y reembolsos.

## Propiedad y límites

Intentos y resultados de pago. Un timeout no autoriza cobrar nuevamente.

Consumir únicamente la entrada pública `@pos-platform/payments`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

Mountain/PagoController y pos-transbank.service; api-pagos-caja es un agregador legacy, no el agente bancario. Véase [trazabilidad y mapa del monorepo](../../../docs/monorepo.md).
