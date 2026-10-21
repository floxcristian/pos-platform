# Maestros

**Estado: scaffolding.** Proyecto Nx con módulo Nest y entrada pública; todavía no hay casos de uso, endpoints, tablas ni adaptadores ejecutables. No declara capacidades listas ni simula efectos exitosos.

## Responsabilidad

Productos, clientes, contactos, direcciones, bancos, vendedores, motivos y referencias consultivas de inventario.

## Propiedad y límites

Espejos con procedencia, vigencia y versión. El POS de Chile no es autoridad de stock.

Consumir únicamente la entrada pública `@pos-platform/catalog`. La app compone módulos y conectará puertos/fachadas cuando exista un caso de uso. No importar controladores, entidades ORM ni carpetas internas de otro contexto.

## Desarrollo del primer caso de uso

Crear dentro de `src/lib` las carpetas que ese caso necesite: `domain` para invariantes puras, `application` para coordinación y puertos, `infrastructure` para persistencia/adaptadores y `api` para transporte. No generar capas vacías por defecto. Las migraciones pertenecen al contexto y se incorporan junto con persistencia real.

Rutas de maestros de Mountain y APIs corporativas ApiCliente/ApiInventario. Véase [trazabilidad y mapa del monorepo](https://github.com/developer-implementos/pos-docs/blob/main/docs/monorepo.md).
