# Diagramas C4 para draw.io

Conversión editable de la [colección Excalidraw](../diagramas-excalidraw/README.md), realizada el 21 de octubre de 2026. Conserva el contenido, la distribución, los colores, las notas y las fuentes de las siete vistas originales. La fecha de revisión arquitectónica indicada dentro de los diagramas sigue siendo la de sus fuentes; la conversión no cambia las decisiones de diseño.

## Archivos

- [Atlas completo: siete pestañas](00-atlas-completo.drawio).
- [C1 · Contexto](01-contexto.drawio).
- [C2 · Contenedores](02-contenedores.drawio).
- [C3 · Backend de sucursal](03-backend-sucursal.drawio).
- [C3 · Sincronizador](04-sincronizador.drawio).
- [Despliegue](05-despliegue.drawio).
- [Flujo de precios](06-flujo-precios.drawio).
- [Flujo de venta](07-flujo-venta.drawio).
- [Paquete ZIP](diagramas-c4-drawio.zip).

## Abrir y editar

Abre draw.io Desktop o [diagrams.net](https://app.diagrams.net/), selecciona **Archivo → Abrir desde → Dispositivo** y elige un `.drawio`. El atlas organiza las vistas en pestañas inferiores.

Las formas, los textos, los grupos y las flechas son elementos nativos editables. Los textos de los nodos se desplazan con su forma; las etiquetas de relaciones se desplazan con el conector. Los conectores estructurales conservan sus extremos asociados a los nodos y sus puntos de recorrido. Los flujos dinámicos conservan las líneas de vida y los recorridos fijos de la fuente: al reorganizar sus participantes, ajusta también las interacciones.

Puedes editar un texto con doble clic. Para editar elementos dentro de un grupo, selecciónalos dentro del grupo o utiliza **Organizar → Desagrupar**. Guarda una copia antes de regenerar.

## Regeneración

La colección y su conversor se mantienen en **pos-platform**, junto a los modelos y documentos de arquitectura. La presentación consume sus derivados fijados a una revisión. Consulta la [guía de autoría](../../tools/diagrams/README.md) para actualizar las fuentes canónicas antes de exportar.

Desde la raíz del monorepo:

```powershell
python tools/diagrams/export-drawio.py
```

El conversor utiliza la biblioteca estándar de Python y toma los siete `.excalidraw` individuales como fuente. Regenera los ocho `.drawio` y el ZIP; sobrescribe las salidas. No requiere un MCP. Los cambios manuales hechos en draw.io no se sincronizan con Excalidraw ni con los documentos de arquitectura.
