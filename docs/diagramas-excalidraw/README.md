# POS Platform · Diagramas editables de la arquitectura propuesta

Esta colección reúne **cinco vistas estructurales y dos dinámicas** del POS corporativo para Chile, Perú y España. Son documentos de diseño para revisar y evolucionar; no acreditan una implementación, un proveedor homologado ni una topología productiva.

Abre [la galería local](index.html) para recorrer los diagramas. Funciona sin dependencias externas y muestra los SVG mediante vistas desplazables. Los textos conservan su tamaño de lectura; cada vista incluye un enlace al SVG completo.

## Archivos

| Vista | Archivo editable | Consulta visual |
| --- | --- | --- |
| 01 · C1: contexto del sistema | [01-contexto.excalidraw](01-contexto.excalidraw) | [SVG](01-contexto.svg) |
| 02 · C2: contenedores | [02-contenedores.excalidraw](02-contenedores.excalidraw) | [SVG](02-contenedores.svg) |
| 03 · C3: backend de sucursal | [03-backend-sucursal.excalidraw](03-backend-sucursal.excalidraw) | [SVG](03-backend-sucursal.svg) |
| 04 · C3: sincronizador de sucursal | [04-sincronizador.excalidraw](04-sincronizador.excalidraw) | [SVG](04-sincronizador.svg) |
| 05 · Complemento: despliegue | [05-despliegue.excalidraw](05-despliegue.excalidraw) | [SVG](05-despliegue.svg) |
| 06 · Dinámica: publicación y activación de precios | [06-flujo-precios.excalidraw](06-flujo-precios.excalidraw) | [SVG](06-flujo-precios.svg) |
| 07 · Dinámica: venta e integración | [07-flujo-venta.excalidraw](07-flujo-venta.excalidraw) | [SVG](07-flujo-venta.svg) |

- [Atlas completo](00-atlas-completo.excalidraw): las siete vistas en un único archivo de Excalidraw.
- [Colección ZIP](diagramas-c4-excalidraw.zip): paquete para descargar y compartir.

Los `.excalidraw` contienen formas, textos y relaciones editables. Los SVG son exportaciones para consultar la composición completa. Para editar, utiliza el archivo nativo correspondiente. Al compartir o extraer la colección, conserva juntos el HTML, los SVG y los archivos editables para que funcionen los enlaces relativos.

## Abrir y editar

1. Descarga un `.excalidraw` individual o el atlas completo.
2. Abre Excalidraw y elige **Abrir** en el menú, o utiliza **Ctrl + O** (**⌘ + O** en macOS), para seleccionar el archivo.
3. Edita formas, etiquetas o relaciones y guarda una copia para conservar tus cambios. El archivo nativo permite seguir trabajando sobre los elementos del dibujo.

La galería no necesita conexión. Para usar el editor, utiliza tu instalación local disponible o [Excalidraw web](https://excalidraw.com). La disponibilidad sin conexión del editor depende de esa instalación; no forma parte de esta galería.

## Lectura y alcance

La colección usa **#0545BA** como color primario. Azul identifica software POS, azul oscuro a personas, violeta a almacenes de datos, gris a sistemas externos y ámbar a infraestructura o condiciones. Los nombres y estereotipos también identifican cada tipo; el significado no depende solo del color.

- **Contexto** identifica actores, el POS y los sistemas externos.
- **Contenedores** explica aplicaciones, procesos, almacenes y comunicaciones. Un contenedor C4 no implica Docker.
- **Componentes** amplía un proceso de backend y un proceso de sincronización. Los módulos interiores no se representan como microservicios separados.
- **Despliegue** distribuye instancias entre puestos, sucursal y país. Es una vista complementaria; el cuarto nivel de C4 sería código.
- **Dinámicas** numeran interacciones de precios y venta, con condiciones, fallos y recuperación. Complementan las vistas estructurales.

Los diagramas mantienen separadas las autoridades y los estados de venta, pago, fiscalidad, precios e integración ERP. La sucursal conserva su autoridad de negocio local; la plataforma de país recibe y consolida bajo el contrato definido. El ACK de aplicación requiere el commit de inbox, efecto local y outbox, y no certifica el resultado de un sistema externo.

Angular + Tauri es la dirección elegida para el cliente. Backend, PostgreSQL, sincronización, integración y topología son parte de la propuesta por implementar y validar. La propiedad de maestros por dato y país, contratos de proveedores, infraestructura, dimensionamiento y objetivos de recuperación siguen pendientes de definición o validación.

La continuidad inicial contempla pérdida de WAN con LAN, backend y PostgreSQL de sucursal disponibles. No incorpora una base de ventas independiente por puesto. Las capacidades efectivas de pago y fiscalidad, vigencia de precios y permisos limitan las operaciones habilitadas.

## Fuentes y mantenimiento

La [guía del modelo C4](../c4-arquitectura-propuesta.md) define niveles, notación, responsabilidades y contratos. La [propuesta de arquitectura](../propuesta-arquitectura.md) gobierna las decisiones. También sustentan la colección:

- [Opciones tecnológicas](../opciones-tecnologicas.md).
- [Operación de caja y evolución](../operacion-caja-y-evolucion.md).
- [Resiliencia y recuperación de datos](../revision-resiliencia-datos-pos.md).
- [Extensibilidad, proveedores y dispositivos](../extensibilidad-proveedores-dispositivos.md).
- [Catálogo de integraciones actuales](../catalogo-integraciones-actuales.md), para distinguir antecedentes de diseño propuesto.

Las fuentes, los modelos y la generación de estos diagramas pertenecen a `pos-platform`. El [manual de herramientas de diagramas](../../tools/diagrams/README.md) describe los comandos para generar Excalidraw, exportar SVG, comprobar las vistas y empaquetar la colección. Los modelos viven en `tools/diagrams/models`; las vistas recortadas de Starlight están en `docs/diagramas-excalidraw/previews` y las fuentes Mermaid en `docs/diagramas-excalidraw/mermaid`.

Los diagramas deben evolucionar junto con estos documentos. Una edición visual no modifica automáticamente la propuesta ni las fuentes que generan otros artefactos del repositorio. Antes de regenerar o integrar cambios, conserva tu copia editada y propaga las decisiones al modelo correspondiente.

Existe un [MCP oficial de Excalidraw](https://github.com/excalidraw/excalidraw-mcp), con el endpoint `https://mcp.excalidraw.com`. **No estaba conectado a esta sesión.** La colección se genera localmente mediante las API de Excalidraw; no necesita ese servidor para abrirse o consultarse.

Referencias primarias para el formato y la notación:

- [Diagramas y niveles del modelo C4](https://c4model.com/diagrams).
- [Formato JSON de Excalidraw](https://docs.excalidraw.com/docs/codebase/json-schema/).
- [Creación programática de elementos](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton).
- [Exportación de SVG y otros formatos](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export).

Fecha de revisión: 5 de octubre de 2026.
