# Autoría de diagramas de POS Platform

Este directorio pertenece al producto. Sus modelos, escenas y fuentes se revisan junto a la arquitectura en `docs/`. El repositorio de presentaciones consume una revisión fijada de los derivados; no mantiene otra fuente editable de estos diagramas.

## Fuentes y salidas

| Responsabilidad | Ubicación |
| --- | --- |
| Identidades, contratos, relaciones y fronteras C4 | `models/c4-data.js` |
| Texto y conexiones de las cinco vistas estructurales | `../../docs/diagramas-excalidraw/mermaid/c4-*.mmd` |
| Geometría SVG revisada, derivada de esas vistas | `models/c4-layouts.json` |
| Participantes y pasos de precios y venta | `models/dynamic-data.cjs` |
| Composición de elementos nativos Excalidraw | `excalidraw-browser.js` |
| Siete escenas, atlas, SVG, galería y distribución ZIP | `../../docs/diagramas-excalidraw/` |
| Cinco recortes con procedencia y hashes | `../../docs/diagramas-excalidraw/previews/` |
| Conversión nativa draw.io, atlas y ZIP | `../../docs/diagramas-drawio/` mediante `export-drawio.py` |
| Bundles temporales, capturas y resultados | `../../tmp/diagrams/` |

`c4-layouts.json` contiene únicamente las cinco vistas C4. Se extrajo sin cambiar geometría de la revisión de documentación anterior a la migración. No incorpora el resto de diagramas históricos del explorador. Las geometrías son una salida revisada, no un lugar alternativo para editar los contratos.

Los ocho archivos `.excalidraw` son editables. Una regeneración reemplaza esas escenas y los SVG: conservar y trasladar al modelo los cambios manuales que deban persistir antes de ejecutarla. Los cambios semánticos requieren actualizar coherentemente C4, Mermaid, flujos y notas; los controles geométricos no validan por sí solos la propuesta.

## Verificación sin instalaciones adicionales

Desde la raíz del monorepo, usando Node compatible con el proyecto:

```sh
node tools/diagrams/render-c4.cjs --check
node tools/diagrams/check-excalidraw.cjs --static
node tools/diagrams/generate-architecture-previews.cjs --check
```

Estos comandos leen los modelos y artefactos versionados. No regeneran archivos, abren navegadores, descargan paquetes ni contactan sistemas externos. Comprueban contratos de nodos y relaciones, referencias nativas, bindings, fronteras, colisiones, contenido del atlas y procedencia de los recortes. No acreditan la ejecución del POS.

## Regeneración deliberada

La herramienta de autoría usa su paquete y lockfile propios en `runtime/`; no se incluye en el build de la web, Starlight o backend. Conserva las versiones que produjeron los artefactos y evita introducir React/Excalidraw en las aplicaciones del producto. El renderizador Mermaid fijado en este runtime es 11.12.1; las geometrías migradas se preservaron tal como estaban y cualquier regeneración requiere revisión visual.

```sh
npm ci --prefix tools/diagrams/runtime
npm ci --prefix apps/pos-docs
npm exec --prefix apps/pos-docs -- playwright install chromium
```

Usar Playwright instalado en la raíz del monorepo o indicar su ruta con `PLAYWRIGHT_MODULE_PATH`. Por ejemplo, en PowerShell:

```powershell
$env:PLAYWRIGHT_MODULE_PATH = (Resolve-Path apps/pos-docs/node_modules/playwright).Path
node tools/diagrams/render-c4.cjs --write
node tools/diagrams/generate-excalidraw.cjs
node tools/diagrams/check-excalidraw.cjs
node tools/diagrams/generate-architecture-previews.cjs --verify
python tools/diagrams/package-excalidraw.py
python tools/diagrams/export-drawio.py
```

Si solo cambian notas o contratos del modelo y la geometría permanece válida, no hace falta volver a renderizar Mermaid. `EXCALIDRAW_RUNTIME` permite usar otro directorio instalado con el mismo lockfile. La exportación nativa usa Arial para medir el texto de Helvetica; la verificación completa se realizó originalmente en Windows y necesita esas fuentes. No asumir equivalencia visual entre sistemas operativos sin revisar los resultados.

La comprobación completa reimporta las ocho escenas en el editor oficial y arrastra un nodo para comprobar sus conectores. El ZIP es una distribución derivada: regenerarlo cuando cambien los documentos incluidos. La galería HTML y su README se mantienen aparte y no se sobrescriben al generar escenas.

La conversión a draw.io usa solamente la biblioteca estándar de Python y toma las siete escenas individuales de Excalidraw. Valida referencias, preservación de texto y páginas al exportar. Es una salida alternativa editable; los cambios manuales en draw.io no regresan automáticamente a Excalidraw ni al modelo C4. Su README se conserva al regenerar los ocho archivos y su ZIP.
