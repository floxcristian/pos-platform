# Base de API de sucursal

> **Alcance de esta base:** el monorepo incluye el frontend Angular/PrimeNG y las entradas backend con su configuración, dependencias y comprobaciones. La API ofrece información del servicio y sondas; los módulos comerciales siguen siendo estructuras iniciales. Compartir repositorio no conecta automáticamente la interfaz a la API ni habilita una caja real.

`apps/pos-runtime` es el punto de entrada HTTP del backend de sucursal propuesto. Usa NestJS 12, Fastify 5 y TypeScript dentro del monorepo Nx. Su alcance actual es una base ejecutable y verificable: arranque, configuración, información del servicio, sondas y contrato OpenAPI. La composición de `country-api`, `pos-sync-worker` y `erp-worker` reutiliza la base técnica de `libs/platform/backend`; la [guía del monorepo](monorepo.md) delimita esos procesos y los contextos de negocio.

El frontend Angular/Tauri conserva sus datos sintéticos y adaptadores mock. Esta API no tiene autenticación, base de datos, ventas, precios ni sincronizadores implementados. Los endpoints disponibles no habilitan operaciones de caja.

## Referencia Core

Las convenciones se contrastaron con [developer-implementos/core](https://github.com/developer-implementos/core/tree/531f9aa80bc0f9b60ca29bfa38e6694453af99ba), commit `531f9aa80bc0f9b60ca29bfa38e6694453af99ba`. La referencia es su código de arranque y sus contratos; no se incorpora Core como dependencia ni se conectan sus servicios.

| Referencia verificada en Core                                                                                                                                                                                                                                                                        | Aplicación en POS                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [Bootstrap y fábricas Nest/Fastify](https://github.com/developer-implementos/core/tree/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/src/bootstrap)                                                                                                                                         | Separar creación, configuración HTTP/OpenAPI y listener en `platform/backend`; cada aplicación conserva su identidad y composición |
| [Módulo y servicio de configuración](https://github.com/developer-implementos/core/tree/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/src/config)                                                                                                                                           | Validar una vez y publicar un snapshot inmutable mediante `RuntimeConfigModule` y `RuntimeConfigService`                           |
| [Logging con Pino](https://github.com/developer-implementos/core/tree/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/libs/shared/backend/observability/src/lib/logging)                                                                                                                                    | Unificar Nest y HTTP mediante `nestjs-pino`, conservar correlación y limitar los datos registrados                                 |
| [Filtro global de excepciones](https://github.com/developer-implementos/core/blob/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/src/common/filters/global-exception.filter.ts)                                                                                                              | Respuesta plana con `code`, `message`, `category` y `timestamp`; la base POS omite `details` y oculta errores internos             |
| [Versionado URI del bootstrap](https://github.com/developer-implementos/core/blob/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/src/bootstrap/bootstrap.ts) y [convenciones OpenAPI](https://github.com/developer-implementos/core/blob/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/AGENTS.md) | Prefijo `api`, versión URI `1`, sondas neutrales y documentación en español con `operationId` estables                             |
| [Helper Vitest/SWC](https://github.com/developer-implementos/core/blob/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/libs/shared/testing/src/config/vitest.helper.ts)                                                                                                                                     | Vitest con transformación SWC y metadata de decoradores para probar la inyección real de Nest                                      |

POS conserva npm, Nx 23 y NestJS 12. La incorporación de varias aplicaciones backend y librerías compartidas justifica Rspack/SWC con el plugin oficial de Nx para empaquetar fuentes internas, manteniendo TSC para comprobar tipos. Los artefactos incluyen manifiesto y lockfile de distribución; no necesitan resolver aliases desde el workspace. Se adapta el [empaquetado de Core](https://github.com/developer-implementos/core/blob/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/rspack.config.js) sin copiar sus plugins correctivos ni su lista de dependencias cloud.

Para Sentry se toma como referencia la [inicialización y cierre de Core](https://github.com/developer-implementos/core/tree/531f9aa80bc0f9b60ca29bfa38e6694453af99ba/apps/core-api/src/common/sentry), con una integración más acotada: un `NodeClient` privado de `@sentry/node` por aplicación, captura explícita y filtrado por campos permitidos. No se copia la inicialización global de `@sentry/nestjs`, el profiling ni las integraciones automáticas de Core. Pino sigue siendo el logger de Nest y HTTP; Sentry es un destino opcional para errores seleccionados.

No se trasladan MongoDB, Redis, servicios cloud, OpenTelemetry ni la autenticación ecommerce de Core: el scaffold no tiene esos consumidores ni contratos, y el backend de sucursal conserva el alcance de la propuesta POS.

## Organización del runtime

La fábrica de aplicación compone módulos y permite crear el servidor sin abrir un puerto, para probarlo con Fastify. El arranque del proceso agrega escucha y cierre; la configuración HTTP y OpenAPI permanece separada de los módulos de negocio. La base de `platform/backend` valida configuración, la expone mediante inyección y concentra logging, errores, sondas y ciclo de vida reutilizados por las aplicaciones. Cada app conserva su punto de entrada y composición.

Las librerías de `libs/backend` establecen un scaffold explícito por contexto. Los casos de uso se implementarán progresivamente, con `api`, `application`, `domain`, `infrastructure` y `config` cuando sus responsabilidades lo justifiquen. Las comunicaciones entre módulos pasan por interfaces o fachadas públicas cuando exista esa capacidad; los esqueletos no devuelven éxitos comerciales ficticios ni sustituyen persistencia o integración real.

## Desarrollo

Requiere Node.js `>=22.19.0 <23` o `>=24 <25` y npm 11.6.0, igual que el monorepo.

Desde la raíz:

```sh
npm ci
npm run api:dev
```

El servidor escucha por defecto en `http://127.0.0.1:3000`. El proceso de desarrollo de Nx recompila los cambios y reinicia la API.

`npm run country:dev` inicia la base HTTP de país en `http://127.0.0.1:3001`. Las aplicaciones tienen identidades y composición separadas; iniciar ambas no establece una conexión entre ellas. Los [comandos del workspace](monorepo.md#comandos-del-workspace) también incluyen las verificaciones de los workers, que componen y cierran su contexto sin ejecutar trabajos de negocio.

Para configurar el entorno local, copia `apps/pos-runtime/.env.example` a `apps/pos-runtime/.env`. Nx carga ese archivo para sus tareas; las variables ya definidas en el entorno tienen prioridad. No versionar `.env` ni secretos. El arranque directo con Node no usa la carga de archivos de Nx: necesita variables del proceso o `node --env-file=/ruta/api.env main.js`.

La validación ocurre antes de escuchar conexiones. `RuntimeConfigModule` registra un snapshot inmutable y `RuntimeConfigService` lo expone a los módulos; los consumidores no necesitan consultar `process.env` ni reinterpretar valores.

| Variable               | Valor por defecto                                | Uso                                                                                            |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | `development`                                    | `development`, `test` o `production`                                                           |
| `POS_API_HOST`         | `127.0.0.1`                                      | Interfaz de escucha; usar `0.0.0.0` solo cuando el despliegue deba aceptar conexiones externas |
| `POS_API_PORT`         | `3000`                                           | Puerto TCP del servicio                                                                        |
| `POS_API_LOG_LEVEL`    | `info`                                           | `trace`, `debug`, `info`, `warn`, `error`, `fatal` o `silent`                                  |
| `POS_API_DOCS_ENABLED` | `true` en desarrollo/test; `false` en producción | Habilita Swagger UI y el documento OpenAPI                                                     |
| `POS_API_CORS_ORIGINS` | vacío                                            | Orígenes HTTP/HTTPS exactos separados por comas; sin permisos entre orígenes por defecto       |

Ejemplo de un origen de desarrollo, cuando se incorpore un consumidor HTTP: `POS_API_CORS_ORIGINS=http://127.0.0.1:4300`. Habilitar CORS no conecta el frontend ni constituye autenticación o autorización.

Estas variables corresponden a `pos-runtime`. `country-api` usa el prefijo `COUNTRY_API_` para las mismas opciones HTTP, con puerto predeterminado 3001. Los workers consumen `NODE_ENV`, su nivel de log (`POS_SYNC_WORKER_LOG_LEVEL` o `ERP_WORKER_LOG_LEVEL`) y las opciones de reporte de errores descritas abajo; no configuran listener HTTP, CORS ni OpenAPI.

## Endpoints

| Método y ruta           | Responsabilidad                                        |
| ----------------------- | ------------------------------------------------------ |
| `GET /api/v1`           | Identifica el servicio y el alcance de esta base       |
| `GET /health/live`      | Comprueba que la aplicación responde                   |
| `GET /health/ready`     | Indica que la aplicación terminó su inicialización     |
| `GET /api/docs`         | Interfaz Swagger, solo con `POS_API_DOCS_ENABLED=true` |
| `GET /api/openapi.json` | Contrato OpenAPI, solo con `POS_API_DOCS_ENABLED=true` |

```sh
curl http://127.0.0.1:3000/api/v1
curl http://127.0.0.1:3000/health/ready
```

Las sondas no consultan PostgreSQL, ERP, dispositivos ni medios de pago. Un resultado saludable expresa disponibilidad de esta aplicación; no demuestra que una sucursal pueda vender. Al incorporar dependencias reales, readiness debe comprobar las necesarias para el tráfico admitido y distinguirlas de integraciones que puedan quedar pendientes.

Las rutas de negocio usan el prefijo `api` y el versionado URI nativo de Nest, con versión inicial `1`. Las sondas se declaran neutrales a versión y quedan fuera de ese prefijo. OpenAPI describe operaciones y DTO en español y usa `operationId` explícitos y estables para los consumidores del contrato.

## Logging, errores y límites HTTP

Cada aplicación backend se ejecuta en un proceso Node independiente. Dentro de ese proceso, Nest y HTTP comparten Pino mediante `nestjs-pino`, cuyo logger raíz se comparte a nivel de proceso; no se admite alojar dos aplicaciones Nest con configuraciones de logging diferentes en el mismo proceso. Cada solicitud recibe un identificador generado por el servidor, devuelto en `x-request-id` y `x-correlation-id`; no se adopta el ID enviado por el cliente. Los registros incluyen contexto de servicio y ambiente, y el registro de finalización HTTP agrega correlación, método, ruta, estado y duración. Se excluyen query, cuerpos y cabeceras; no se habilita un segundo registro automático de Fastify.

La protección de campos estructurados elimina las claves configuradas de credenciales, datos personales y solicitudes/respuestas en la raíz y hasta dos niveles de anidación. Los serializadores explícitos de `err`, `error` y `context` también se aplican al logger HTTP, con `wrapSerializers: false` para impedir que `pino-http` reinstale su serializador de errores. Los errores conservan solo un tipo genérico, y el contexto admite un nombre técnico acotado.

El hook `logMethod` reconoce las sobrecargas con `Error`, campos `err`/`error` o un `context` no técnico antes de que Pino derive `msg` desde la excepción. Las convierte en un evento con campos técnicos permitidos y el mensaje fijo `Operation failed`. Las pruebas cubren las sobrecargas reales de `Logger` y `PinoLogger`. Esta protección no sanitiza recursivamente cualquier objeto ni detecta secretos escritos dentro de un mensaje libre arbitrario. Los consumidores deben registrar eventos y campos técnicos expresamente elegidos, sin pasar DTO, objetos de proveedores ni texto del usuario. La captura opcional de Sentry conserva únicamente frames reducidos para diagnóstico.

En aplicaciones y contextos se inyecta el logger de `nestjs-pino`. El adaptador de plataforma puede usar el puente `Logger` de Nest configurado con el mismo destino; no debe introducirse otro logger independiente. Las pruebas comprueban niveles, contexto y redacción de valores sintéticos.

Durante la construcción del contenedor Nest, su logger permanece desactivado para no almacenar ni imprimir excepciones originales antes de configurar la protección. Después se conecta Pino y se registra un evento técnico de composición terminada; los fallos de arranque mantienen un mensaje público genérico.

Los errores HTTP mantienen una respuesta plana con cuatro campos:

| Campo       | Contrato                                                      |
| ----------- | ------------------------------------------------------------- |
| `code`      | Código estable para identificar el error                      |
| `message`   | Mensaje público del error; genérico para errores internos 500 |
| `category`  | Clasificación del error                                       |
| `timestamp` | Momento de la respuesta en formato ISO 8601                   |

Esta base no devuelve `details`, stacks ni el mensaje de una excepción interna. La correlación viaja en las cabeceras; no se duplica en el cuerpo del error. Los futuros códigos de negocio requerirán un contrato explícito antes de incorporarse.

Fastify limita el cuerpo a 1 MiB y configura `requestTimeout` en 30 segundos para recibir la solicitud. Ese plazo no cancela por sí mismo un caso de uso ni una llamada externa: esas operaciones necesitarán sus propios límites y cancelación. La aplicación también activa validación de DTO y cabeceras de seguridad; estos controles no sustituyen autenticación ni autorización.

## Reporte opcional de errores con Sentry

Sentry está deshabilitado por defecto y los cuatro `.env.example` dejan el DSN vacío. Activarlo requiere configurar deliberadamente las variables de la aplicación; esta entrega no conecta ningún proyecto real de Sentry. No cambia el estado de disponibilidad de la API ni habilita operaciones de negocio.

| Sufijo de variable           | Valor por defecto | Uso                                                                   |
| ---------------------------- | ----------------- | --------------------------------------------------------------------- |
| `SENTRY_ENABLED`             | `false`           | Habilita el reporter; `true` exige un DSN válido                      |
| `SENTRY_DSN`                 | vacío             | Destino autorizado de los eventos, configurado fuera del repositorio  |
| `SENTRY_RELEASE`             | vacío             | Versión opcional del despliegue, sin datos personales ni credenciales |
| `SENTRY_SHUTDOWN_TIMEOUT_MS` | `2000`            | Límite de cierre y envío pendiente, entre 1 y 10000 ms                |

Cada sufijo lleva el prefijo del proceso: `POS_API_`, `COUNTRY_API_`, `POS_SYNC_WORKER_` o `ERP_WORKER_`. Por ejemplo, `POS_API_SENTRY_ENABLED=false` y `POS_API_SENTRY_DSN=` mantienen deshabilitado el reporter de sucursal. El ambiente se obtiene de `NODE_ENV` y la identidad del servicio la fija la aplicación.

La captura ocurre una vez en fronteras explícitas: errores HTTP 5xx inesperados, fallos al crear o iniciar la aplicación después de validar su configuración y errores al inspeccionar el contexto del worker. No se reportan errores de validación/cliente ni el 503 esperado de readiness. Los argumentos de comando inválidos y los fallos anteriores a disponer de configuración válida se registran localmente; no dependen de un cliente Sentry todavía no configurado. Los workers siguen sin procesar jobs. No hay captura global de toda excepción del proceso, trazas distribuidas, profiling, replay ni exportación automática de logs.

El reporter construye un evento mínimo y `beforeSend` vuelve a limitar sus campos. Conserva códigos técnicos propios, fase, servicio, ambiente, release opcional, identificadores UUID de solicitud/correlación y estado HTTP cuando correspondan. Conserva hasta 40 frames de error, reducidos al nombre base del archivo y sus números de línea/columna. No envía el mensaje original de la excepción, stack bruto, rutas completas, URL, query, cuerpos, cabeceras, cookies, usuario, breadcrumbs ni objetos arbitrarios en `extra` o `contexts`.

Cada aplicación tiene su cliente privado, sin instalar integraciones automáticas ni modificar un SDK global compartido. El cierre es idempotente y acotado por el timeout configurado. Ese envío es de mejor esfuerzo: no constituye una cola durable ni garantiza entrega durante caída de red o terminación forzada. Los tests usan un transporte en memoria y valores sintéticos; no acreditan la recepción en un proyecto real de Sentry.

## Verificación

```sh
npm run api:test
npm run api:check
npm run api:smoke
```

`api:check` ejecuta los targets Nx `lint`, `typecheck`, `test` y `build` de `pos-runtime`.

Las pruebas usan Vitest y SWC con metadata de decoradores, siguiendo el mecanismo utilizado por Core para inyección de Nest. Cubren configuración y comportamiento HTTP de la aplicación con Fastify, sin requerir servicios externos. Rspack/SWC genera el bundle distribuible; TSC comprueba tipos por separado. Ni la transformación de pruebas ni el empaquetado sustituyen esa comprobación.

`api:smoke` compila y copia el artefacto a una carpeta temporal fuera del monorepo, instala allí sus dependencias con `npm ci --omit=dev` y arranca la aplicación compilada en modo producción, con un puerto efímero de loopback. Comprueba por HTTP la información del servicio, las sondas y que la documentación devuelve 404; también instancia el SDK Sentry del artefacto con un transporte en memoria y comprueba el filtrado de canarios sintéticos. Después cierra la aplicación y elimina la copia temporal. Así verifica que la API funciona con sus propias dependencias, sin resolver paquetes desde el `node_modules` del workspace ni enviar eventos a un servicio Sentry real. La instalación requiere acceso al registro npm.

El job `api` de CI ejecuta `backend:check`, `structure:check` y `backend:smoke`, separado de los jobs del frontend y escritorio. Cubre las cuatro aplicaciones backend y sus librerías; los comandos `api:*` siguen disponibles para trabajar solo sobre `pos-runtime`.

Para abarcar las cuatro aplicaciones backend y sus librerías, usar `npm run backend:check`, `npm run backend:build` y `npm run backend:smoke`. `npm run structure:check` verifica las reglas arquitectónicas. La comprobación de cada worker solo acredita su composición y cierre; todavía no hay transporte o jobs de negocio que probar.

La comprobación del artefacto también captura los logs del proceso: exige una sola entrada de finalización por solicitud, correlación compartida entre Nest y HTTP y ausencia de valores sensibles sintéticos enviados en headers, query, cuerpo y rutas desconocidas.

## Artefacto y ejecución

```sh
npm run api:build
```

El resultado se genera en `dist/apps/pos-runtime`: bundle de aplicación y librerías internas, `package.json` y lockfile con las dependencias externas del runtime. La entrega del servicio utiliza esa carpeta, sin copiar el `node_modules` completo del monorepo ni publicar las librerías fuente por separado. Las demás aplicaciones backend generan su propio artefacto bajo `dist/apps/<aplicación>`.

En el destino, desde la carpeta del artefacto:

```sh
npm ci --omit=dev
node --env-file=/ruta/api.env main.js
```

El archivo del despliegue o el entorno del proceso debe definir `NODE_ENV=production`. Configure host, puerto y orígenes según el servicio que reciba tráfico. Mantenga OpenAPI deshabilitado salvo habilitación deliberada. El archivo de entorno del ejemplo es externo al artefacto y no se incluye en el repositorio.

Esta API es un proceso Node independiente. El `vercel.json` despliega el frontend estático y la documentación Starlight; no publica `pos-runtime` ni las demás aplicaciones backend. El despliegue del backend de sucursal necesita su propia supervisión de proceso, terminación TLS, identidad y política de acceso antes de incorporar operaciones reales.

## Evolución prevista

La propuesta usa un backend modular de sucursal y PostgreSQL como persistencia compartida por sus cajas. Los clientes hablan con la API; no consultan tablas directamente. Las librerías `contracts`, `shared-kernel` y `country-policies` fijan la ubicación de contratos y reglas puras; los adaptadores HTTP y de persistencia permanecen en su frontera. Los contextos de negocio ya tienen ubicación en el scaffold, pero autenticación, autorización, persistencia, migraciones, transacciones e inbox/outbox se incorporarán con pruebas de sus garantías, sin presentarlos como implementados por esta base.

La [propuesta de arquitectura](propuesta-arquitectura.md) y las [opciones tecnológicas](opciones-tecnologicas.md) explican la ubicación del backend y los límites del perfil sin WAN. El servicio no promete autonomía de una caja ante caída de la LAN o del servidor de sucursal.

## Referencias técnicas

- [Adaptador oficial Fastify de NestJS](https://docs.nestjs.com/techniques/performance): integración HTTP; los plugins y middleware deben ser compatibles con Fastify.
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino): integración del logger de Nest y contexto de solicitudes.
- [Clientes y scopes aislados de Sentry](https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/): patrón de cliente manual sin `Sentry.init()` global; su ejemplo de navegador se adapta aquí a `NodeClient` y se comprueba con el SDK Node instalado.
- [Integraciones de Sentry para Node](https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/): instrumentación y contexto que pueden añadir los plugins; el cliente manual del POS usa una lista vacía y captura explícita.
- [Filtrado de eventos de Sentry](https://docs.sentry.io/platforms/javascript/guides/node/configuration/filtering/): uso de `beforeSend` antes de enviar eventos; la base POS reconstruye sus campos permitidos.
- [Opciones del servidor Fastify](https://fastify.dev/docs/latest/Reference/Server/): límites de cuerpo y tiempo de recepción de solicitudes.
- [Preparar aplicaciones para despliegue con Nx](https://nx.dev/docs/guides/ci-deployment): generación del manifiesto y lockfile del artefacto para instalar sus dependencias fuera del workspace.
- [Rspack con Nx](https://nx.dev/docs/technologies/build-tools/rspack/introduction): integración del empaquetador con el workspace y sus tareas.
- [Ejecutores TypeScript/Node de Nx](https://nx.dev/docs/technologies/typescript/executors): ejecución del resultado de compilación y tareas de empaquetado.
