# Visor de interacciones entre aplicaciones y datos

**Guía canónica de uso del visor.** La [entrada a la presentación](../presentation/README.md) enlaza esta guía; la [matriz de cobertura](cobertura-documentacion-presentacion.md) registra evidencia y alcance sin mantener otro manual. Las decisiones objetivo se gobiernan en la [propuesta y sus ADR](propuesta-arquitectura.md#decisiones-de-arquitectura).

El visor explica **qué aplicación pide una operación, quién la procesa, qué tablas lee o escribe y qué confirma cada respuesta**. El diagrama muestra aplicaciones, sistemas externos y datos; controladores, clases y servicios internos se consultan al seleccionar una aplicación o conexión. Complementa los recorridos de tablas y el catálogo de endpoints; no reemplaza su evidencia.

El mapa actual incluye venta/DTE, sincronización con AX, maestros, cliente por RUT, impresión y notas de crédito. La propuesta añade dos recorridos: **venta local** y **entrega/conciliación ERP**. Es diseño por implementar y probar. Los nombres de tablas, comandos y estados son ejemplos de contrato; no acreditan DDL, rutas HTTP ni funcionalidades instaladas.

## Abrir el detalle adecuado

Las pestañas separan preguntas independientes y muestran un solo panel a la vez. Al alternar dentro del capítulo se conservan las selecciones y los pasos; un selector no filtra automáticamente las otras pestañas. Ecosistema comienza en **Vista general**:

| Pestaña | Para qué sirve | Acceso directo |
| --- | --- | --- |
| Vista general | Ubicar las responsabilidades y abrir la ficha de una pieza. | [Abrir vista general](../presentation/index.html#mapa?vista=general) |
| Repositorios | Saber dónde está el código y examinar sus relaciones. | [Abrir repositorios](../presentation/index.html#mapa?vista=repositorios) |
| Peticiones | Seguir una operación entre aplicaciones, llamadas y datos. El visor está visible sin otro acordeón de entrada. | [Abrir peticiones](../presentation/index.html#mapa?vista=peticiones) |
| Evidencia | Consultar Rutas, Despliegue o Fuentes y pendientes. El inventario completo de componentes se abre bajo demanda en el último modo. | [Abrir evidencia](../presentation/index.html#mapa?vista=evidencia) |

V01 tiene un único acceso en Evidencia → Despliegue. Los diagramas V02–V06 se consultan en [vistas de arquitectura y flujos](vistas-arquitectura-y-flujos.md). Las fichas conservan implementación, fuentes y límites junto a la pieza consultada.

Los otros capítulos con pestañas tienen estas entradas. La primera de cada fila se abre por defecto; `?vista=…` permite enlazar directamente una pregunta.

| Capítulo | Pestañas y accesos directos |
| --- | --- |
| Venta | [Recorrido de la venta](../presentation/index.html#venta?vista=recorrido) · [Apertura, cierre e impresión](../presentation/index.html#venta?vista=operacion) |
| Offline | [Probar una desconexión](../presentation/index.html#offline?vista=laboratorio) · [Otros fallos y recuperación](../presentation/index.html#offline?vista=fallos) |
| Propuesta | [Arquitectura](../presentation/index.html#propuesta?vista=arquitectura) · [Qué cambia](../presentation/index.html#propuesta?vista=cambios) · [Venta y ERP](../presentation/index.html#propuesta?vista=peticiones) · [Precios y ofertas](../presentation/index.html#propuesta?vista=precios) · [Tecnología](../presentation/index.html#propuesta?vista=tecnologia) |
| Evolución | [Países](../presentation/index.html#evolucion?vista=paises) · [Cambio de ERP](../presentation/index.html#evolucion?vista=erp) · [Proveedores y equipos](../presentation/index.html#evolucion?vista=proveedores) · [RFID](../presentation/index.html#evolucion?vista=rfid) · [Despliegue](../presentation/index.html#evolucion?vista=despliegue) |

Con el foco en una pestaña, **← / →** cambian de panel y **Home / End** van al primero o al último. Al salir de la pestaña con el visor ampliado, este se cierra y devuelve el foco a la pestaña seleccionada.

Datos mantiene un único explorador de D01–D05, con maestros D03 como entrada. El contexto de lotes y cliente se consulta dentro de D03/D04; el horario pertenece a D02/D03. No hay un segundo resumen de esos recorridos. IA conserva juntos los controles que modifican su ejemplo; Repaso mantiene sus ejercicios.

Los enlaces anteriores `#mapa?flujo=…` abren Peticiones. En Propuesta, `?flujo=proposed-sale` y `?flujo=proposed-erp` abren **Venta y ERP** y seleccionan el recorrido solicitado, sin otro desplegable de entrada.

| Recorrido | Acceso directo |
| --- | --- |
| Venta y DTE actuales | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=sale) · [tablas D01](../presentation/index.html#datos?flujo=D01) |
| Envío y respuesta AX | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=sync) · [tablas D02](../presentation/index.html#datos?flujo=D02) |
| Maestros MPOS → sucursal | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=masters) · [tablas D03](../presentation/index.html#datos?flujo=D03) |
| Cliente por RUT | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=customer) · [tablas D04](../presentation/index.html#datos?flujo=D04) |
| Impresión | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=printing) |
| Notas de crédito | [Aplicaciones y llamadas](../presentation/index.html#mapa?flujo=credit) · [tablas D05](../presentation/index.html#datos?flujo=D05) |
| Venta local propuesta | [Intención, efectos y commit](../presentation/index.html#propuesta?flujo=proposed-sale) |
| Entrega ERP propuesta | [Custodia y conciliación](../presentation/index.html#propuesta?flujo=proposed-erp) |

El lector elige la pregunta: mapa para ubicar aplicaciones, recorrido de llamadas para seguir contratos y Datos para ver lecturas/escrituras. Son perspectivas complementarias de la misma evidencia; no hace falta repetirlas todas durante una exposición.

## Cómo leerlo

1. Elegir el recorrido y comprobar su etiqueta de **situación actual** o **propuesta**. Comparar intenciones no convierte una capacidad nueva en algo existente.
2. Leer el límite del recorrido: conectividad necesaria, autoridad de escritura y condiciones pendientes.
3. Elegir un paso mediante sus botones numerados y una llamada en **Conexión de este paso**. Una flecha indica una interacción; las conexiones del mismo paso pueden representar alternativas o escrituras de una misma transacción. El selector conserva estas ramas sin dibujarlas como una única cadena.
4. Abrir la ficha de una aplicación, tabla o conexión para consultar contrato, efecto, límite y fuente. **Implementación y código** conserva los controladores, servicios y llamadas internas auditados.
5. Usar **Aplicaciones y datos** para ubicar las piezas (vista inicial de escritorio), **Seguir paso** para aislar el emisor/receptor (vista inicial móvil) y **Secuencia** para recorrer las interacciones visibles. Las dos primeras dibujan una conexión seleccionada a la vez.
6. Usar **Ajustar**, **100 %**, **−/+** y **Centrar paso**, o desplazar/arrastrar el fondo. **Ampliar visor** abre un diálogo. Tab y Enter/Espacio activan controles, aplicaciones y conexiones; Escape cierra el diálogo y devuelve el foco.

Las llamadas internas entre clases de una misma aplicación se agrupan en su ficha. HTTP, SOAP, AMQP y las consultas a bases se mantienen, incluso cuando su origen y destino pertenecen a la misma aplicación. Los nombres de tablas y las rutas verificadas conservan su escritura original; una operación ORM sin SQL observado se describe como lectura o escritura, sin inventar una consulta literal.

**Grupo no significa servidor físico.** “Sucursal”, “país/entidad” y “proveedor” son fronteras de responsabilidad. Los hosts, instancias, balanceadores, réplicas, puertos efectivos y topología de producción requieren evidencia adicional. Un grupo puede reunir módulos en un proceso; una fachada o ACL no obliga a desplegar un microservicio.

Las etiquetas pueden ocupar varias líneas y el lienzo ajusta su tamaño al contenido. El zoom y el desplazamiento permiten inspeccionar nombres completos; la compactación conserva tipografía, fuentes e inspección por teclado.

La rueda del ratón y los gestos verticales recorren el diagrama cuando tiene contenido fuera de vista. Si cabe completo o se llega a su borde, el desplazamiento continúa en la página. En **Ampliar visor**, continúa dentro del diálogo y mantiene quieta la página de fondo.

**Secuencia didáctica no significa orden universal.** El régimen fiscal y la capacidad del proveedor determinan cuándo emitir, confirmar o compensar. Las ramas de pago externo y fiscalidad solo se ejecutan cuando corresponden al tipo de operación. La ausencia de Internet no habilita esas capacidades por sí sola.

## Venta local propuesta

Identificador estable: `proposed-sale`. Fuente: [datos de interacciones propuestas](../presentation/interactions-proposed.js).

| Paso | Interacción que enseña | Frontera que debe quedar visible |
| --- | --- | --- |
| Validar | Interfaz → fachada de venta → reglas y capacidades | El servicio de sucursal decide con permisos, maestros y recursos válidos. |
| Preparar | Fachada → intenciones y binding → puertos | La intención se confirma antes del primer efecto externo; todavía no es venta final. |
| Resolver pago | Puerto → aplicación local → medio externo → observación | La rama no aplica a todos los medios. ACK de la aplicación local no demuestra cobro ni liquidación. |
| Condición fiscal | Puerto → proveedor fiscal → estado | Emisión externa, contingencia y orden dependen del régimen y perfil homologado. |
| Custodiar evidencia | Observaciones → persistencia de sucursal | Se acusa la observación después de guardarla; un resultado incierto sigue pendiente. |
| Confirmar | Fachada → negocio + outbox → interfaz | Las dos escrituras SQL forman **un solo commit final**, seguido del estado permitido a la UI. |

Se distinguen tres fronteras:

- **Transacción de intención:** conserva operación, intento, comando, hash y destino antes del efecto.
- **Efecto externo:** no comparte transacción con PostgreSQL; puede ocurrir aunque se pierda su respuesta.
- **Transacción final:** reúne venta, líneas, impuestos, referencias/estado de pago, movimientos aplicables, registros fiscales simultáneos exigidos y evento de salida. Si una de sus escrituras falla, no se confirma parcialmente.

El ejemplo mantiene **un escritor de negocio por sucursal**, con LAN y PostgreSQL operativos. Perder la WAN no exige esperar al ERP; perder el escritor o la LAN puede detener las operaciones en este perfil. El journal de la aplicación local permite recuperar comandos y observaciones, no aceptar nuevas ventas como segundo escritor. La caja sigue sin ser dueña del stock.

Si el proveedor cobró y después falla la escritura local, se recupera la misma operación desde la intención, el journal y la consulta soportada. Si el proveedor no permite consultar, se conserva la incertidumbre y se aplica resolución controlada. Cambiar adquirente, generar otra identidad o repetir a ciegas no resuelve la falta de evidencia.

Fuentes: [confirmación local](propuesta-arquitectura.md#confirmación-local-de-una-venta), [capacidades efectivas](extensibilidad-proveedores-dispositivos.md#4-configuración-tipada-y-capacidades-efectivas), [custodia y resultados](extensibilidad-proveedores-dispositivos.md#5-contratos-conceptuales-y-resultado-durable), [monolito modular](opciones-tecnologicas.md#6-monolito-modular-y-unidades-de-ejecución).

## Entrega y resultado ERP propuestos

Identificador estable: `proposed-erp`. Se apoya en el perfil preferente **outbox local → HTTPS → registro operativo PostgreSQL central → worker/ACL**. Añadir un broker es una decisión separada; este recorrido no obliga a instalarlo en cada sucursal.

| Paso | Interacción que enseña | Frontera que debe quedar visible |
| --- | --- | --- |
| Entregar | Publicador lee outbox; publicador → API autenticada | Se reenvía con la misma identidad; una respuesta de transporte no prueba registro ERP. |
| Recibir | API → inbox + efecto operativo/trabajo | Estas escrituras comparten una transacción central. |
| Acusar | API → publicador → acuse local | ACK durable confirma custodia central; conservar recuperación tras restore/replay. |
| Fijar destino | Worker lee/reclama trabajo; worker → binding → ACL | País, entidad y fase de autoridad resuelven el destino antes del efecto. |
| Intentar | ACL → ERP → resultado normalizado | El ERP está fuera de la transacción de inbox y puede dejar resultado desconocido. |
| Conciliar | Evidencia → estado; consulta condicionada al ERP | Consultar si el contrato lo admite; si no, intervención controlada sin envío ciego. |

Este recorrido termina en el resultado ERP central. El contrato de retorno o consulta de ese resultado desde la sucursal no está representado; el ACK de custodia no lo sustituye.

La inbox evita repetir **su efecto transaccional local**. No demuestra que el ERP aplique el efecto exactamente una vez. Un evento duplicado equivalente obtiene el resultado de recepción ya confirmado; un mismo ID con contenido distinto se rechaza y alerta.

El binding conserva ERP, referencia y versión del mapeo. Cambiar la configuración global no mueve operaciones pendientes al nuevo ERP. Una venta offline anterior al corte que llega tarde exige la política de autoridad acordada; el reloj del terminal no decide por sí solo. Consultas y efectos relacionados con operaciones históricas conservan sus referencias de origen.

Las ventanas de recepción central, ejecución ERP y mantenimiento son políticas distintas. Solo se recibe fuera de la ventana ERP si existe autorización y almacenamiento durable disponible. Reintentos, límites, checkpoints y backoff/jitter pertenecen al responsable de cada frontera.

Fuentes: [sincronización y consistencia](propuesta-arquitectura.md#sincronización-y-consistencia), [registro operativo](revision-arquitectura-corporativa.md#5-una-base-intermedia-sí-puede-ser-útil-una-copia-indiscriminada-del-erp-no), [corte de ERP](revision-arquitectura-corporativa.md#7-cómo-conservar-la-inversión-al-cambiar-el-erp), [recuperación y custodia](revision-resiliencia-datos-pos.md#durabilidad-y-recuperación-no-son-la-misma-garantía).

## Reglas de evidencia

| Elemento | Regla |
| --- | --- |
| Código actual | Citar repositorio, SHA y líneas pertinentes. Una ruta declarada no demuestra consumidor, host, ejecución productiva ni resultado observado. |
| Presentación o apuntes | Identificar el origen y las discrepancias. No elevar una ubicación lógica a servidor confirmado. |
| Propuesta | Etiquetar explícitamente; citar la decisión o documento de diseño. Una fuente de propuesta no acredita implementación. |
| Endpoint no implementado | Mostrar comando o contrato semántico y “ruta HTTP pendiente”. No inventar una URL precisa. |
| Protocolo externo | Usar “Por confirmar” cuando depende del proveedor/adaptador. `HTTP` puede especificar HTTPS en el detalle. |
| Datos propuestos | Señalar nombres ilustrativos y propiedad de escritura. No presentarlos como tablas existentes ni renombrar tablas legacy en el dibujo. |
| ACK o éxito | Explicar exactamente qué confirma: recepción durable, commit local, evidencia de proveedor u otro estado. No usar un “sincronizado” que mezcle etapas. |
| Falta de capacidad | Conservar la limitación; consulta, reversa, idempotencia y offline no se presumen universales. |

El [catálogo de integraciones actuales](catalogo-integraciones-actuales.md), las [vistas auditadas](vistas-arquitectura-y-flujos.md) y los [recorridos reales de tablas](recorridos-datos-tablas.md) sirven para contrastar el objetivo con lo existente. El visor no amplía por sí solo la cobertura auditada.

## Contrato de datos y renderer

La fuente propuesta es [`presentation/interactions-proposed.js`](../presentation/interactions-proposed.js), cargada como script local y expuesta en `window.POS_INTERACTIONS_PROPOSED`. No se ejecutan operaciones POS ni llamadas a proveedores. La estructura permite que un renderer HTML/SVG construya grupos, nodos, conexiones y secuencias sin generar Mermaid ni consultar servicios remotos.

| Colección/campo | Contenido |
| --- | --- |
| Flujo | `id`, `title`, `mode`, `summary`, `boundary`. Los dos flujos de este archivo llevan `mode: 'proposed'`. |
| `groups` | `id`, título, repositorio objetivo, runtime candidato, zona y evidencia. Repositorio/host pendientes se declaran. |
| `nodes` | ID y grupo, título, `kind` (`component`, `table` o `external`), resumen, detalle y fuentes. |
| `edges` | ID, emisor/receptor, etiqueta, protocolo, detalle, efecto, límite, certeza y fuentes. Todas las conexiones de este archivo llevan `certainty: 'proposed'`. |
| `steps` | Título, explicación, IDs de conexiones activas y límite del paso. |

Cada ID debe ser único dentro del flujo. Toda conexión referencia nodos existentes y cada paso referencia conexiones existentes. Mapa y secuencia leen **los mismos datos** para evitar que cambien los participantes, efectos o límites entre vistas.

Los archivos auditados conservan el detalle original. [`interactions-view-data.js`](../presentation/interactions-view-data.js) construye la vista de aplicaciones y datos sin modificarlos: agrega los componentes por aplicación, mantiene las tablas y llamadas de transporte y conserva los originales en `implementationNodes` y `implementationEdges`. `window.POS_INTERACTIONS_VIEW.all()` entrega los ocho recorridos utilizados por el renderer.

Los nombres propuestos `sales.*`, `payments.*`, `cash.*`, `fiscal.*` e `integration.*` separan responsabilidades a modo de ejemplo. No son un ADR aprobado, DDL listo ni afirmación de que cada módulo necesite otra base. La [convención de nombres](propuesta-arquitectura.md#convenciones-y-vocabulario) y las migraciones se acuerdan antes de implementarlos.

Para inspeccionar los datos en el navegador, con el script cargado:

```js
const flow = window.POS_INTERACTIONS_PROPOSED
  .find(item => item.id === 'proposed-erp');
flow.steps.map(step => ({
  title: step.title,
  interactions: step.edges.map(id =>
    flow.edges.find(edge => edge.id === id))
}));
```

La inspección muestra metadatos; no dispara una venta, cobro, escritura SQL o solicitud ERP. Las fichas y sus fuentes son la alternativa legible al código del dataset.

## Implementación y navegación

El visor usa HTML y SVG propios. No depende de Mermaid para el layout de estas vistas ni descarga librerías durante la presentación. Las vistas conceptuales y los diagramas documentales Mermaid permanecen disponibles como referencia.

- `interactions-current.js`: venta, sincronización, maestros y cliente.
- `interactions-extensions.js`: impresión y notas de crédito.
- `interactions-proposed.js`: venta local y entrega/conciliación ERP.
- `interactions-view-data.js`: vista de aplicaciones y datos, con implementación accesible en las fichas.
- `interactions-ui.js` y `interactions.css`: mismo modelo de datos para mapa y secuencia.

El lector selecciona cada paso y conexión a su ritmo. Las fichas quedan junto al gráfico; no es necesario abrir otra ventana para leer una llamada. El visor ampliado es una ventana modal con cierre por Escape.

## Criterios de verificación del visor

- Navegación por teclado de selector, pasos, nodos y conexiones; foco visible, fichas junto al diagrama y cierre del visor ampliado con Escape, devolviendo el foco al botón que lo abrió.
- Lectura por un paso a la vez, resumen textual y acceso a fuentes; el color no es la única señal de actividad.
- Mapa y secuencia conservan emisor, receptor, protocolo, efecto, fuente y frontera del mismo contrato.
- Layout responsive, zoom/scroll contenido en el mapa y ausencia de recortes en fichas. La navegación del mapa no cambia accidentalmente el capítulo.
- Apertura local `file://`, sin solicitudes externas durante la navegación. Los enlaces de evidencia se abren solo por acción del lector.
- Validación de IDs/referencias, enlaces locales/anclas y estado propuesto; la prueba de interfaz no certifica capacidades de las aplicaciones corporativas.

Estos criterios son de aceptación del tutorial. Las garantías financieras, fiscales, de recuperación y de entrega requieren pruebas del POS real y la evidencia listada en [validación y decisiones](validacion-y-decisiones.md).


## Repositorios y ampliación central

La pestaña Repositorios de Ecosistema muestra un [mapa de los seis repositorios del POS actual](mapa-repositorios-y-conexiones.md) con diez relaciones seleccionadas. Las fichas de core/devops-platform y la evidencia de su relación de CI/CD se encuentran en [Propuesta → Tecnología](../presentation/index.html#propuesta?vista=tecnologia), dentro de la reutilización corporativa. Los nombres de repositorio aparecen también en las aplicaciones y sus fichas. Sincronización muestra WSO2, broker, consumidor Node, PostgreSQL central y adaptador AX; el detalle explica Synapse, DSS y Java. Maestros incorpora MPOS, lotes y api-lectura. Las variantes no se presentan como una cadena obligatoria. [Alcance de la auditoría central](analisis-repositorios/mountain-concentrador.md).
