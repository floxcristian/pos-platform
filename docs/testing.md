# Pruebas del monorepo

La organización acordada separa aplicaciones operativas, documentación y proyectos de pruebas. Las suites actuales `e2e/` y `e2e-mobile/` confluirán en un proyecto de clientes, conservando configuraciones y resultados separados. El destino de las suites Angular de los clientes es `apps/pos-clients-e2e`; el soporte técnico reutilizable se agrupará en `libs/shared/testing`. **La migración física sigue pendiente.** El [mapa del monorepo](monorepo.md) conserva las rutas actuales.

## Cobertura existente y ubicación

| Comprobación | Ruta actual | Qué verifica | Límite |
| --- | --- | --- | --- |
| Playwright web | `e2e/`, `e2e-mobile/` y sus configuraciones Playwright | Acceso, checkout, administración, navegación y comportamiento visual con datos sintéticos | No recorre una venta persistida en PostgreSQL ni sincronizada con país |
| HTTP de sucursal y país | `apps/pos-runtime/test` y `apps/country-api/test` | Composición Nest/Fastify, sondas, errores y políticas HTTP mediante la aplicación real | No hay operaciones comerciales ni persistencia |
| Base técnica común | `libs/platform/backend/test` | Logging, Sentry y ciclo de vida de workers | No acredita colas ni integraciones operativas |
| Reglas puras y mock | Tests junto a las bibliotecas | Invariantes y comportamiento local implementado | No sustituye pruebas del backend futuro |
| Fronteras arquitectónicas | `tools/eslint` | Reglas de imports y calidad existentes | Los nuevos límites de shared requieren actualizar los controles |
| Artefactos backend | `tools/verify-api-artifact.mjs` | Arranque fuera del workspace con dependencias de producción | No acredita recuperación comercial |
| Documentación | `apps/pos-docs/scripts` | Fuentes, catálogo, build, enlaces, búsqueda y navegador | No acredita funcionamiento del POS |
| Escritorio Windows | Job `windows-desktop` de CI | Compilación y empaquetado Tauri | No es una suite E2E nativa |

## Proyecto E2E de clientes objetivo

`apps/pos-clients-e2e` será un proyecto de pruebas Nx vinculado a `pos-desktop` y `pos-mobile` mediante dependencias explícitas, porque visitar una URL no permite inferir el vínculo por imports. No se añade a las seis aplicaciones operativas ni se publica como servicio.

La migración debe conservar `npm run test:e2e` y `npm run test:e2e:mobile`, la configuración de navegador, los fixtures, el control de tiempo, los reportes y las capturas de fallos. Localmente se podrá iniciar el servidor web; CI seguirá probando el build de producción. Se actualizarán las rutas al mover la configuración y los tests. Si se activa caché o ejecución affected, sus entradas deben incluir la configuración, fixtures y aplicación probada; entornos externos mutables no se consideran reproducibles por defecto.

## Soporte compartido de pruebas

`shared/testing` será una agrupación de utilidades de pruebas con entradas explícitas según consumidor. No se mezclan fixtures de navegador, configuración Vitest y dependencias de base de datos en un único barrel obligatorio.

Se extraen mecanismos técnicos usados por varias suites: relojes controlables, capturadores de logs, preparación de infraestructura o simuladores de transporte. Las fábricas y escenarios comerciales de ventas, caja o pagos permanecen cerca del contexto propietario. Producción no puede importar soporte de pruebas; esa prohibición requiere reglas y casos negativos durante la migración.

`tools/backend` conserva configuración de compiladores y ejecutores del workspace. Mover código bajo `shared/testing` no convierte una herramienta de build en dependencia del producto.

## Suites futuras y garantías

- **Sistema:** una futura `apps/pos-system-e2e` recorrerá APIs, PostgreSQL, entrega y recepción entre procesos cuando estén implementados. Deberá verificar commit de venta y outbox, duplicados, reinicios, pérdida de acuses, concurrencia y resultados externos inciertos.
- **Hosts nativos:** las futuras suites nativas verificarán capacidades implementadas de Tauri y Capacitor en sus entornos homologados. Chromium sobre la web no demuestra instalación, actualización, WebView ni periféricos.
- **Adaptadores:** contratos y pruebas de integración se añaden con cada proveedor, sin ejecutar pagos o dispositivos productivos en suites ordinarias.

Estas suites no existen por describirlas aquí. La ausencia de un recorrido implementado no se resuelve creando proyectos vacíos ni pruebas que devuelvan éxitos ficticios.

## Comandos actuales y aceptación de la migración

Los comandos siguientes siguen apuntando a las rutas actuales:

```sh
npm test
npm run test:e2e
npm run test:e2e:mobile
npm run backend:check
npm run backend:smoke
npm run structure:check
```

Para la documentación se ejecutan `validate`, `typecheck`, `build` y `check` desde `apps/pos-docs`. El [plan de migración](implementation-plan.md#reorganización-del-monorepo-acordada) exige comprobar imports, empaquetado, comportamiento web y correspondencia del catálogo después de trasladar las rutas.
