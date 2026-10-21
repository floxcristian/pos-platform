# Publicación de la documentación en Vercel

Vercel publica únicamente la aplicación Starlight `pos-docs`. La guía conserva `/guide/` y la entrada `/` redirige a ella. Los clientes `pos-desktop` y `pos-mobile` tienen sus propios bundles Angular y artefactos nativos; no se publica una demo POS en este sitio. Las APIs y los workers se despliegan por separado.

## Configuración del proyecto existente

Conservar el proyecto Vercel asociado a [floxcristian/pos-platform](https://github.com/floxcristian/pos-platform). La raíz del repositorio debe seguir siendo el **Root Directory**: la guía consume fuentes de `docs/` y modelos de `tools/diagrams/`, además de su aplicación.

| Ajuste | Valor |
| --- | --- |
| Production Branch | `main` |
| Root Directory | Raíz del repositorio |
| Framework Preset | `Other` |
| Aplicación publicada | `apps/pos-docs` |
| Install Command | `npm ci --prefix apps/pos-docs` |
| Build Command | `npm --prefix apps/pos-docs run build` |
| Salida estática | `dist/apps/pos-docs` |
| Entrada | `/guide/`, con redirección desde `/` |
| Node.js | `24.x`, compatible con el rango del paquete |
| Variables de entorno | No requiere secretos para generar la guía |

`vercel.json` instala y construye sólo el paquete documental, sin instalar las dependencias Angular/Nest del producto. Fija salida, cabeceras y redirecciones. Desde un workspace completo, `npm run build:vercel` ofrece la misma entrega documental mediante Nx. Los ajustes de rama y Node se revisan en el proyecto Vercel. No crear otro proyecto ni volver a publicar los bundles de cliente para mantener la documentación.

## Comprobación antes y después de publicar

`npm run docs:install` instala el compilador documental. `npm run docs:validate`, `npm run docs:typecheck`, `npm run docs:build` y `npm run docs:check` comprueban fuentes, tipos, generación e interacción; sus resultados no certifican el funcionamiento del POS. El workflow `Documentation quality` ejecuta esos controles de forma independiente.

Tras el despliegue, abrir `/` y comprobar su llegada a `/guide/`. Recargar una página interna, buscar un término, recorrer los catálogos y abrir un diagrama. `documentation.snapshot.json` identifica la revisión de origen y debe corresponder al commit publicado, con `dirty: false`.

La política CSP admite los scripts y activos del propio sitio; Pagefind necesita `wasm-unsafe-eval` para su búsqueda. No se habilita evaluación JavaScript arbitraria ni se agregan orígenes de APIs del producto. Los activos generados no contienen credenciales, repositorios legacy completos ni datos de producción.

## Separación de entregas

`npm run build` construye los clientes Angular y no publica un sitio. `npm run desktop:build` empaqueta Tauri; los comandos `mobile:*` construyen, sincronizan o ejecutan Capacitor según la etapa. Sus guías están en [escritorio](desktop.md) y [móvil](mobile.md). Ninguna de esas acciones instala automáticamente un cliente en sucursales o lo publica en una tienda.

El [backend](api.md#artefacto-y-ejecución) conserva sus propios artefactos y supervisión de procesos. Publicar Starlight no inicia una API, un worker, una base de datos ni un sincronizador.

## Referencias

- [Configuración de build y directorio de salida](https://vercel.com/docs/builds/configure-a-build).
- [Configuración versionada con vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
