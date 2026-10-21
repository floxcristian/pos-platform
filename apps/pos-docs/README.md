# Documentación de POS Platform

<span id="documentación-pos-platform"></span>

Starlight es una aplicación del monorepo. Las decisiones, contratos, evidencias del legacy y guías de implementación viven en `docs/`; la navegación, componentes y catálogos viven en `apps/pos-docs/`. El código y su documentación se revisan en el mismo repositorio.

<span id="comandos"></span>

## Desarrollo y comprobación

El compilador documental tiene su propio `package.json` y lockfile: no hereda Angular, Nest ni el pipeline PostCSS del POS. Requiere Node 22.19 o posterior en la rama 22, o Node 24. Desde la raíz:

```sh
npm run docs:install
npm run docs:dev
```

También se puede trabajar sin instalar las dependencias del producto:

```sh
npm --prefix apps/pos-docs ci
npm --prefix apps/pos-docs run validate
npm --prefix apps/pos-docs run typecheck
npm --prefix apps/pos-docs run build
npm --prefix apps/pos-docs exec playwright install chromium
npm --prefix apps/pos-docs run check
npm --prefix apps/pos-docs run preview
```

Nx registra `pos-docs` con tags documentales y entradas de caché que incluyen las fuentes de `docs/`. No importa bibliotecas del producto ni forma parte de los procesos de caja, sucursal o país. El monorepo incluye web, escritorio, cuatro entradas backend y esta aplicación documental. El catálogo distingue la demostración frontend, la base HTTP y los esqueletos de workers; seis entradas operativas no acreditan seis servicios productivos ni sus integraciones.

<span id="fuente-de-cada-contenido"></span>
<span id="diagramas-e-interacción"></span>
<span id="revisión-y-mantenimiento-de-cambios"></span>

## Fuentes y mantenimiento

- `content-map.mjs` gobierna las rutas en inglés, el menú, el recorrido principal y el alcance de cada página.
- Los documentos técnicos de `docs/` son fuentes editables. El generador divide las fuentes extensas sin perder ni duplicar líneas, mantiene anclas y comprueba referencias.
- Los catálogos en `src/data/` conservan el snapshot revisado, las descripciones de endpoints y la configuración del legacy, sin valores de despliegue.
- `monorepo-catalog.json` gobierna el árbol propuesto. `npm --prefix apps/pos-docs run sync:catalog` actualiza las representaciones del propio repositorio.
- `docs/diagramas-excalidraw/` conserva las escenas editables y sus derivados. Los modelos y generadores canónicos están en `tools/diagrams/`.
- Las carpetas generadas de `src/content/docs/` no se editan ni se versionan. Los componentes Astro, estilos y páginas de entrada se mantienen a mano.

Actualizar fuentes, contratos y sus síntesis en el mismo cambio. Conservar la distinción entre propuesta, implementación, evidencia e historia; una prueba de enlaces no acredita funcionamiento productivo ni comprensión por parte del equipo. La [auditoría documental](../../docs/auditoria-documentacion.md) describe esos límites.

<span id="publicación-y-controles"></span>

## Publicación

La salida estática autocontenida es `dist/apps/pos-docs`: incluye `/guide/`, los documentos y activos públicos necesarios. No requiere un checkout de la presentación, repositorios legacy, claves, video ni MP3. Los scripts inline se externalizan para conservar CSP; Pagefind usa WebAssembly solo bajo `/guide/`.

`npm run build` continúa construyendo la web. `npm run build:vercel` compila ambas aplicaciones y ensambla `dist/vercel`, con POS en `/` y documentación en `/guide/`. La [configuración de Vercel](../../docs/vercel.md) detalla instalación y publicación. El workflow `Documentation quality` valida esta aplicación de forma independiente.

La [presentación y narrador](https://presentation-gamma-rust.vercel.app/reveal) conservan su repositorio. Consumen un snapshot generado de la documentación, identificado por commit y hashes, para compilar sin depender de `main` mutable ni de un checkout vecino. `tools/export-documentation.mjs` produce ese artefacto durante el build; solo se exportan datos públicos seleccionados. Una versión con cambios locales se marca como tal y no debe actualizar el consumidor publicado. El snapshot es un derivado, no otra fuente editorial.

Mover documentación no modifica automáticamente el guion de la presentación ni regenera audio. Cuando cambie una decisión, revisar también las síntesis y narraciones que la explican.
