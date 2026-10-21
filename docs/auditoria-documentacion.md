# Auditoría de consistencia y organización documental

Revisión editorial y técnica del **21 de octubre de 2026** sobre la guía Starlight de POS Platform, sus fuentes, catálogos, diagramas y recorridos vinculados. El punto de partida publicado era el commit `61bdb60` del repositorio de documentación. Esta revisión no ejecuta el legacy ni acredita la arquitectura desplegada.

## Resultado y alcance

Las decisiones fundamentales estaban mayormente alineadas: producto corporativo multipaís, perfil inicial ante pérdida de WAN, autoridad transaccional de sucursal, PostgreSQL, separación de estados financieros y entrega recuperable. **La documentación no era completamente consistente ni suficientemente fácil de recorrer**: había deriva de nombres, contratos descritos con alcance distinto, ejemplos incompletos y evidencia local presentada de forma poco visible.

Se revisaron la organización de todas las páginas y sus fuentes; se contrastaron en profundidad los contratos de venta, precios, sincronización, acceso, integración y estructura del código. Los catálogos legacy se contrastaron con el snapshot identificado. Se distinguió la revisión de contenido de la comprobación de interfaz y de las pruebas operativas que todavía necesita el producto.

## Hallazgos y correcciones

| Hallazgo | Consecuencia para el lector | Corrección en la fuente |
| --- | --- | --- |
| Tres árboles distintos del monorepo | Nombres de aplicaciones y ubicaciones de módulos incompatibles; un desarrollador podía empezar en una estructura equivocada. | Catálogo único de seis apps y 21 ubicaciones de bibliotecas. Documentación y dos vistas de presentación se generan desde él. Se contrasta opcionalmente con los proyectos del workspace. |
| Scaffolding local confundible con producto publicado | Un árbol y un módulo podían interpretarse como funcionalidad implementada o disponible en GitHub. | Estado por aplicación, alcance de revisión local y separación de negocio pendiente, maqueta y base técnica. La narración de esa lámina se actualizó. |
| Tauri figuraba como candidato en algunos documentos | La dirección de cliente parecía abierta en unas páginas y indicada en otras. | Dirección Angular + Tauri consistente; homologación y despliegue permanecen pendientes. |
| «ACK» sin nombrar su frontera | Recepción de un paquete podía confundirse con aceptación central, aplicación comercial o contabilización ERP. | Contrato canónico por frontera: aceptación central tras transacción pactada; recepción de paquetes y activación separadas; resultado ERP independiente. |
| Contrato detallado de precios disperso | Condiciones críticas vivían solo en el documento de diagramas. | La propuesta contiene preparación aislada, corte consistente, deltas, bajas, validación y activación. C4 resume y enlaza ese contrato. |
| Versión fijada sin aclarar vencimiento | Podía interpretarse que una promoción vencida seguía disponible por conservar su versión. | Revalidación antes de cobrar, política de cotización por acordar y recuperación de un pago iniciado conservando identidad e importe. |
| Animación de precios incompleta | Su pseudocódigo omitía cursor/inbox aplicados y adelantaba un cursor con un hueco. | Activación atómica de versión, inbox y cursor; los mensajes fuera de orden permanecen en espera. IDs de venta, solicitud, evento e intento diferenciados. |
| Métricas ilustrativas parecían criterios acordados | Cifras como disponibilidad, autonomía y recuperación podían convertirse en compromisos sin evidencia. | Criterios de aceptación centrados en medición, alcance, responsables y evidencia. Los valores necesitan acuerdo y pruebas. |
| Catálogo API sin relación visible con el resumen funcional | Las mismas rutas parecían pertenecer a otro inventario al cambiar los nombres de agrupación. | Resumen generado por capacidad y correspondencia con las 12 responsabilidades originales, sin duplicar endpoints. |
| Configuración legacy ausente y un falso positivo | Faltaba explicar las dependencias de entorno; `URL_API_PAGO` se contaba aunque sus usos estaban comentados. | Catálogo de 48 variables activas del backend y 14 del monitor, con 117 referencias activas comprobadas; referencias comentadas separadas, sin publicar valores. |
| Recorrido inicial demasiado extenso y siglas sin apoyo | El lector debía elegir entre muchas páginas antes de entender dónde corre una venta. | Visión general concreta, recorrido principal de 12 páginas, glosario por temas y extensiones opcionales fuera del recorrido base. |
| Referencias históricas mezcladas con la propuesta vigente | Ejercicios y decisiones del explorador anterior parecían describir la presentación Reveal actual. | Alcance visible por página y materiales históricos identificados. Starlight, Reveal y explorador tienen entradas y finalidades explícitas. |
| Jerarquía de títulos y controles de publicación incompletos | Secciones extraídas conservaban saltos H1→H3; una advertencia de enlace no impedía publicar. | Normalización de encabezados conservando fragmentos, validación de navegación y fallos de build ante referencias rotas o árboles divergentes. |

## Fuente que gobierna cada tema

| Tema | Fuente canónica | Cómo se mantienen las otras vistas |
| --- | --- | --- |
| Producto, autoridad de datos y contratos de comportamiento | [Propuesta y decisiones](propuesta-arquitectura.md) | Starlight la divide sin perder ni duplicar líneas. C4 y simulaciones sintetizan los contratos y requieren revisión semántica cuando cambian. |
| Apps y ubicaciones del monorepo | `apps/pos-docs/src/data/monorepo-catalog.json` | `tools/sync-monorepo-catalog.mjs` genera los árboles y tabla de apps; `--check` detecta deriva. [Estructura y estado](opciones-tecnologicas.md#5-monorepo-con-nx). |
| Rutas y configuración de Mountain | `legacy-endpoints.json` y `legacy-configuration.json`, en `apps/pos-docs/src/data/` | Componentes de Starlight generan grupos, conteos y referencias. Cada entrada conserva el snapshot y evidencia de código. |
| Evidencia del sistema actual | [Informes por repositorio](analisis-repositorios/README.md) | Catálogos y resúmenes conservan sus límites. Un commit revisado no se convierte en versión productiva confirmada. |
| Orden, rutas y estado de páginas | `apps/pos-docs/content-map.mjs` | Navegación, recorrido principal y generación comparten el mapa; no se mantienen listas independientes de nombres de aplicaciones. |
| Narración | Guion de Reveal y pipeline de narración | Manifiestos y hashes comprueban correspondencia de texto y audio. La coherencia con el significado del diagrama requiere revisión humana, además de esa comprobación. |

## Comprobaciones reproducibles

- `npm run docs:validate`: rutas sin duplicar, páginas alcanzables, alcance editorial, recorrido principal, catálogos y representaciones del monorepo.
- `npm run docs:typecheck`: componentes, TypeScript y contenido de Astro.
- `npm run build`: cobertura de fuentes, referencias, render de Starlight, scripts compatibles con CSP y medios verificados.
- `npm run docs:check`: enlaces, anclas, encabezados, búsqueda, filtros, configuración, diagramas, recorridos y diseño a 1440, 768, 375 y 320 píxeles.
- `node tools/sync-monorepo-catalog.mjs --check --workspace <checkout-pos-platform>`: contraste opcional contra proyectos reales; no ejecuta el producto.

El workflow `Documentation quality` ejecuta los controles en pushes a `main` y pull requests. La compilación también rechaza referencias de fuente rotas y árboles divergentes. Las pruebas del navegador producen un informe y capturas; no detectan por sí solas todas las contradicciones de significado.

La revisión de evidencia local comprobó **582 referencias**, **314 objetos Git** y **571 anclas**, sin errores, además de las declaraciones del catálogo API. Estas cifras describen la verificación de enlaces al código, no pruebas de los servicios. La revisión de configuración diferenció lecturas activas y comentarios mediante el árbol de sintaxis del código.

## Claridad para desarrolladores junior

La entrada principal explica primero el producto, qué corre en caja/sucursal/país y una venta completa. Después conecta ese recorrido con apps, bibliotecas y contratos. El glosario define los términos aplicados al POS; las tablas de estado impiden confundir una maqueta o una carpeta con una capacidad operativa.

No se realizaron sesiones de comprensión con integrantes junior del equipo. La revisión editorial reduce barreras concretas, pero **no permite garantizar que cualquier lector entenderá todo**. La validación de comprensión pendiente consiste en que integrantes del equipo puedan explicar dónde se confirma una venta, qué confirma central, qué se adapta por país, dónde vive cada responsabilidad en el código y qué falta implementar, sin resolver contradicciones entre fuentes.

## Pendientes que necesitan decisiones o evidencia externa

| Pendiente | Responsable funcional por asignar | Evidencia necesaria |
| --- | --- | --- |
| Operaciones permitidas sin WAN y vigencias de cotización | Producto, comercial, fiscalidad y pagos | Matriz aprobada por país y casos de vencimiento antes/después de iniciar pago. |
| Recuperación, capacidad y objetivos de servicio | Operaciones, plataforma y DBA | Mediciones, restauración, fallos controlados y capacidad de proveedores. |
| Versiones realmente instaladas y perfiles activos del legacy | Equipos de sucursal, integración y seguridad | Inventario productivo y contraste con los snapshots revisados. |
| Publicación y evolución de la base de código POS | Ingeniería POS | Versionar la estructura que corresponda, implementar casos de uso y demostrar sus pruebas. Este repositorio de documentación no publica por sí solo el scaffolding de otro checkout. |
| Comprensión por el equipo destinatario | Responsable de documentación y referentes del equipo | Sesiones de lectura de la propuesta y registro de términos o recorridos todavía ambiguos. |

Los [criterios del piloto](validacion-y-decisiones.md) y la [información pendiente](solicitud-informacion-equipo.md) conservan el detalle técnico y operativo. Esta auditoría no sustituye esas decisiones.
