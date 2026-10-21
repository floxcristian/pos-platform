# POS Platform

Plataforma POS corporativa preparada para evolucionar a varios países: monorepo Nx con clientes de escritorio y móvil, backend de sucursal, backend de país y workers. Incluye una demostración funcional de Chile con datos sintéticos y una base técnica NestJS/Fastify; las operaciones de negocio del backend y las integraciones están pendientes. Conserva el lenguaje visual de **prime-showcase** (PrimeNG, Aura corporativo, Inter, tablas y navegación).

Producto y repositorio: [POS Platform](https://github.com/floxcristian/pos-platform). Los aliases internos usan `@pos-platform/*`. La [guía del monorepo](https://github.com/developer-implementos/pos-docs/blob/main/docs/monorepo.md) explica aplicaciones, propietarios de datos, estructura por contexto y compatibilidad del cambio de nombre.

## Repositorio del producto

Los clientes Angular con PrimeNG para escritorio (Tauri) y móvil (Capacitor) y la base del backend se mantienen en este repositorio. La documentación técnica y Starlight pertenecen a [POS Docs](https://github.com/developer-implementos/pos-docs), con publicación independiente. `floxcristian/corporate-pos` conserva una versión anterior del frontend; el desarrollo vigente continúa en `floxcristian/pos-platform`.

| Ubicación | Responsabilidad y estado |
| --- | --- |
| `apps/pos-desktop` | Cliente Angular propio para escritorio, alojado en Tauri |
| `apps/pos-mobile` | Cliente Angular propio para Android/iOS, alojado en Capacitor |
| `libs/client-shell` | Composición Angular compartida: rutas, configuración y shell |
| `apps/branch-api` | Base HTTP NestJS/Fastify de sucursal |
| `apps/country-api` | Base HTTP de país |
| `apps/branch-sync-worker`, `apps/erp-worker` | Composición de workers; procesamiento de jobs pendiente |
| `libs/` | Features del frontend, contextos del backend y contratos compartidos, con límites de importación |

Las aplicaciones comparten repositorio y contratos, con builds independientes. El cliente conserva sus datos de demostración; la conexión con los casos de uso del backend se implementará a medida que existan esos contratos.

![Centro de operación con indicadores, gráficos y pendientes](https://github.com/developer-implementos/pos-docs/blob/main/docs/screenshots/dashboard.png)

## Iniciar

Requiere Node.js 22.19 o posterior en la rama 22, o Node.js 24, y npm 11.6.0.

Si tu instalación usa otra versión de npm, instala las dependencias con `npx --yes npm@11.6.0 ci`.

```sh
git clone https://github.com/floxcristian/pos-platform.git
cd pos-platform
npm ci
npm start
```

Abre **http://127.0.0.1:4300** para desarrollar la interfaz del cliente de escritorio. Este servidor local no es una aplicación web independiente ni un despliegue público. `npm run desktop:dev` abre Tauri; `npm run mobile:start` sirve la interfaz móvil para desarrollo. La [decisión de clientes nativos](https://github.com/developer-implementos/pos-docs/blob/main/docs/decisions/native-clients.md) explica la separación y los límites.

 La pantalla de acceso permite iniciar sesión con cuentas de demostración. Puedes completar el formulario desde **Accesos de demostración** o usar `admin@example.test` y la contraseña pública `Demo123!`. También están disponibles `supervisor@example.test`, `caja@example.test` y `auditor@example.test`, con la misma contraseña.

Hay una caja abierta con datos de ejemplo. El menú de usuario permite cambiar el perfil de demostración, simular desconexión, cambiar el tema y **Cerrar sesión**. La sesión se conserva en la pestaña; **Mantener sesión en este equipo** permite restaurarla al volver a abrir el navegador. Cerrar sesión elimina ese acceso, sin cerrar el turno ni borrar la venta en curso. Para comenzar de nuevo con los datos de ejemplo: **Módulos y configuración → Demostración → Restablecer**.

Todos los RUT, clientes, usuarios y operaciones son ejemplos sintéticos. No hay autenticación real, cargos bancarios, DTE válidos ni conexiones a sistemas corporativos. No ingreses información de producción.

## API de sucursal

```sh
npm run api:dev
```

La API escucha en **http://127.0.0.1:3000**. Expone información de la base en `/api/v1`, sondas en `/health/live` y `/health/ready`, y OpenAPI en `/api/docs` durante el desarrollo. Usa NestJS con Fastify como un proyecto Nx independiente: `apps/branch-api`.

Los nombres backend expresan ámbito y proceso: `branch-api`, `branch-sync-worker`, `country-api` y `erp-worker`. Para actualizar un checkout anterior, revisar la [migración de nombres y variables de entorno](https://github.com/developer-implementos/pos-docs/blob/main/docs/api.md#actualización-de-nombres-y-configuración); los comandos `api:*` y `sync:check` se conservan.

La base sigue las convenciones verificadas de **Core**: composición de arranque separada, configuración tipada e inyectable, logging unificado con `nestjs-pino`, errores HTTP con contrato estable, versionado URI y pruebas Vitest/SWC. La [guía de la API](https://github.com/developer-implementos/pos-docs/blob/main/docs/api.md#referencia-core) identifica el commit de referencia y las decisiones adaptadas al backend de sucursal.

El reporte de errores con Sentry es opcional y está deshabilitado en los ejemplos, con DSN vacío. Cada aplicación tiene un cliente privado que captura fallos en fronteras explícitas y admite solo metadatos técnicos y frames reducidos; no envía datos de clientes, cuerpos de operaciones ni logs completos. Consulta el [alcance de captura y configuración](https://github.com/developer-implementos/pos-docs/blob/main/docs/api.md#reporte-opcional-de-errores-con-sentry). No se ha conectado un proyecto real de Sentry.

Los puntos de entrada `country-api`, `branch-sync-worker` y `erp-worker` preparan los procesos de país, sincronización y ERP. Comparten la base técnica de `libs/platform/backend`; los contextos de `libs/backend` delimitan dónde implementar las capacidades. Rspack/SWC empaqueta las aplicaciones Node y sus librerías fuente; TSC verifica tipos. Crear estas fronteras no conecta bases, colas ni proveedores.

```sh
npm run api:check
npm run api:build
npm run api:smoke
```

Para comprobar el scaffold completo: `npm run backend:check`, `npm run backend:smoke` y `npm run structure:check`. `npm run country:dev` inicia la API de país en el puerto 3001; `npm run sync:check` y `npm run erp:check` verifican la composición y cierre de los workers sin ejecutar jobs. Consulta todos los [comandos del workspace](https://github.com/developer-implementos/pos-docs/blob/main/docs/monorepo.md#comandos-del-workspace).

El backend y las librerías puras tienen lint con información de tipos para detectar promesas sin manejar y usos inseguros, además de fronteras Nx verificadas. Las [reglas y su alcance](https://github.com/developer-implementos/pos-docs/blob/main/docs/monorepo.md#reglas-de-código-y-fronteras) distinguen esos controles de los del frontend; no sustituyen pruebas de comportamiento ni los requisitos pendientes de producción.

El frontend sigue usando sus adaptadores mock. Esta base de API aún no implementa autenticación, base de datos, operaciones de negocio ni sincronizadores; la sonda de readiness comprueba únicamente la aplicación. Consulta [configuración, contratos y despliegue de la API](https://github.com/developer-implementos/pos-docs/blob/main/docs/api.md).

## Publicar la documentación en Vercel

Starlight se construye y publica desde [POS Docs](https://github.com/developer-implementos/pos-docs). La configuración de Vercel de este repositorio conserva las redirecciones del sitio anterior. Los clientes se distribuyen mediante sus artefactos nativos; sus bundles Angular no se publican como demo en Vercel. El backend conserva sus despliegues propios. Consulta la [guía de publicación documental](https://github.com/developer-implementos/pos-docs/blob/main/docs/vercel.md).

## Recorridos

| Área              | Qué puedes probar                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inicio            | Indicadores por período y sucursal, gráficos, ranking y pendientes derivados de las operaciones                                                                                                |
| Venta             | Productos y códigos de barra, cantidades, descuentos y ofertas, cliente express, boleta/factura, despacho, pagos mixtos, vuelto y ventas pausadas; órdenes de venta con condiciones protegidas |
| Pagos             | Efectivo, débito/crédito, transferencia, cheques con Orsan, crédito cliente, NC y USD; escenario de pago incierto con conciliación sin volver a cobrar                                         |
| Mi caja           | Apertura, ingresos/egresos, custodia, conteo por denominación, arqueo, diferencias con motivo, cierre, cambio de cajero y confirmación de depósitos de custodia                                |
| Documentos        | Búsqueda y filtros, detalle, estados local/pago/fiscal/ERP separados, emisión simulada y representación imprimible                                                                             |
| Cobranzas         | Saldos y documentos pendientes, convenios en cuotas, cobro y anticipos aplicables a ventas sin cobrar de nuevo                                                                                 |
| Devoluciones      | Nota de crédito por cantidades, emisión fiscal simulada y devolución de dinero como acciones distintas                                                                                         |
| Maestros          | Productos, clientes, bancos, plazas, motivos de NC y vendedores; edición validada y exportación                                                                                                |
| Precios y ofertas | Cambio de precio, condiciones por cliente/volumen, descuentos por producto y vigencia, habilitación y auditoría                                                                                |
| Reportes          | Ventas, pagos, caja, cobranzas, devoluciones y pendientes fiscal/ERP; filtros y CSV                                                                                                            |
| Sincronización    | Flujos de subida/bajada, ejecución manual, horarios e intervalos por día, errores simulados, reintentos, cola de salida e historial                                                            |
| Control           | Logs con correlación, auditoría por actor/acción y diagnóstico descargable                                                                                                                     |
| Administración    | Módulos y políticas, usuarios/permisos, sucursales/cajas, dispositivos e integraciones, recorrido de actualización mock                                                                        |

El inventario consultivo no cambia al vender: la caja de Chile no es la autoridad de stock. Los temporizadores de sincronización funcionan mientras la aplicación está abierta; no son un servicio de Windows.

## Arquitectura

La organización acordada agrupa lo transversal en `libs/shared/` y conserva los contextos en `libs/backend/`. **La migración física está pendiente.** El árbol siguiente resume las rutas actuales; el destino acordado y su correspondencia se mantienen en la [guía del monorepo](https://github.com/developer-implementos/pos-docs/blob/main/docs/monorepo.md#correspondencia-con-el-checkout-actual) del repositorio editorial.

```text
apps/
  pos-desktop/          # Cliente Angular y Tauri
  pos-mobile/           # Cliente Angular y Capacitor
  branch-api/           # API de sucursal
  branch-sync-worker/   # Proceso de sincronización de sucursal
  country-api/          # API de país
  erp-worker/           # Proceso de integración ERP
libs/
  backend/              # Contextos de negocio y sus contratos públicos
  platform/backend/     # Base técnica del servidor
  client-shell/         # Composición compartida de los clientes
  features/             # Pantallas y recorridos
  ui/                   # Componentes, estilos y assets
  domain/               # Reglas del prototipo
  data-access/          # Adaptadores mock
  shared-kernel/        # Modelo mínimo transversal
  contracts/            # Contratos compartidos
  country-policies/     # Perfiles puros actuales
```

Core es solo referencia de organización y convenciones; no es dependencia ni servicio del POS. Las bibliotecas backend no importan Angular ni los adaptadores mock. Las carpetas compartidas conservan responsabilidades independientes y entradas públicas explícitas.

Las features consumen `PosStore`; no escriben en `localStorage`. Los permisos y módulos se validan en rutas **y comandos**. El estado se publica como snapshots inmutables. Las transacciones guardan primero el snapshot y publican el resultado solo si la persistencia tuvo éxito. Las ventas y eventos conservan identificadores para evitar duplicados. Pago, fiscalidad y ERP tienen ciclos separados.

La identidad de acceso se guarda por ID de usuario en `corporate-pos:auth:v1`, separada de los datos de negocio y del turno de caja. Usa `sessionStorage` o `localStorage` según la opción de permanencia; nunca guarda la contraseña. Las rutas protegidas redirigen al login y la autorización consulta el rol del usuario activo. Son controles de demostración locales: el adaptador debe sustituirse por autenticación y autorización corporativas para producción.

Los límites de importación se verifican con Nx/ESLint. Se usan Angular con detección de cambios OnPush y signals, TypeScript estricto, carga diferida por área y componentes PrimeNG. La tipografía y los iconos se sirven localmente. No se utilizan `patch-package`, dependencias privadas de fuentes, telemetría ni servicios del proyecto de referencia.

## Validación

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run desktop:info
```

Las pruebas cubren políticas, montos, persistencia, permisos, reintentos, calendarios y recorridos de navegador. CI está configurada para compilar y empaquetar la demostración para Windows; las nuevas ejecuciones publican el artefacto `pos-platform-windows-demo` durante siete días. Las acciones de CI están fijadas por commit y tienen permisos de lectura.

Validación tras la revisión de calidad (3 de octubre de 2026): **144 pruebas de lógica e infraestructura y 37 recorridos de navegador pasan**, junto con lint, formato y compilación web de producción. Los recorridos ejecutan el bundle productivo con la CSP de Tauri, incluyen tamaños de 375 y 1440 px y verifican controles de prime-showcase y accesibilidad del dashboard/reportes en claro y oscuro. El [informe de revisión](https://github.com/developer-implementos/pos-docs/blob/main/docs/quality-review.md) detalla correcciones y condiciones pendientes para producción.

La [ejecución histórica de CI](https://github.com/floxcristian/corporate-pos/actions/runs/37151843645), del repositorio anterior, completó las validaciones de esa revisión. Las comprobaciones actuales se consultan en [Actions de pos-platform](https://github.com/floxcristian/pos-platform/actions). El instalador se puede regenerar con `npm run desktop:build`.

## Clientes nativos

```sh
npm run desktop:dev
npm run desktop:build
```

El escritorio necesita Rust, MSVC/Windows SDK y WebView2. Consulta [preparación de Tauri](https://github.com/developer-implementos/pos-docs/blob/main/docs/desktop.md). Para Android/iOS consulta [preparación de Capacitor](https://github.com/developer-implementos/pos-docs/blob/main/docs/mobile.md); su compilación Angular no acredita apertura, permisos, periféricos ni distribución nativa. `npm run build` compila los dos clientes Angular secuencialmente; `desktop:build` empaqueta Tauri y los comandos móviles sincronizan o ejecutan sus proyectos nativos. El contenedor no tiene comandos para cobrar, imprimir físicamente o acceder libremente al sistema. El instalador de CI es una demostración sin firma comercial.

## De maqueta a producto

Esta entrega permite validar la UX y las reglas mock; **no es una caja certificada ni lista para operar en producción**. El adaptador local del navegador y la base HTTP no sustituyen la persistencia transaccional de sucursal, autenticación corporativa, permisos verificados por servidor, conciliación bancaria ni homologación fiscal. Esas fronteras y el diseño para evolucionarlas se describen en [arquitectura](https://github.com/developer-implementos/pos-docs/blob/main/docs/architecture.md), [seguridad](https://github.com/developer-implementos/pos-docs/blob/main/docs/security.md), [base de API](https://github.com/developer-implementos/pos-docs/blob/main/docs/api.md) y [contratos mock](https://github.com/developer-implementos/pos-docs/blob/main/docs/mock-api.md).

La cobertura de Chile y las referencias revisadas están en [inventario de la caja actual](https://github.com/developer-implementos/pos-docs/blob/main/docs/audit-chile-for-product.md). Ese inventario distingue la funcionalidad de referencia, la simulación y lo que necesita integración real.

## Documentación técnica

Las fuentes canónicas, Starlight, catálogos y diagramas se mantienen en [developer-implementos/pos-docs](https://github.com/developer-implementos/pos-docs). Su [guía de mantenimiento](https://github.com/developer-implementos/pos-docs/blob/main/apps/starlight/README.md) contiene los comandos de desarrollo, validación y publicación; el build del POS no instala ni ejecuta Astro.

Cuando cambien contratos, nombres o límites de una aplicación, actualizar la documentación y registrar la revisión del producto que sustenta esa evidencia. La revisión del código y la actualización editorial se enlazan entre ambos repositorios; no mantener copias editables de la guía en este monorepo.

`vercel.json` desactiva nuevos despliegues automáticos desde este repositorio. La guía anterior conserva su último despliegue hasta conectar el repositorio editorial al proyecto Vercel; la configuración publicable está en `pos-docs`.
