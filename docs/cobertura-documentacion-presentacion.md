# Cobertura entre fuentes, documentación y presentación web

**Alcance histórico:** esta matriz describe el explorador `presentation/index.html` y sus ampliaciones. Las menciones a ejercicios, capítulos y navegación corresponden a ese material, no a la presentación vigente en Reveal ni al recorrido de Starlight. La [auditoría documental del 21 de octubre](auditoria-documentacion.md) registra la organización y las correcciones actuales; la [guía de presentación](../presentation/README.md#propuesta-en-revealjs) explica Reveal.

Revisión iniciada el **1 de octubre de 2026**, con actualización técnica y auditoría editorial del **2 de octubre** y reorganización de la navegación del **3 de octubre**. Este documento explica dónde encontrar cada tema y registra las diferencias de profundidad. **La presentación web resume los recorridos principales y permite explorar fichas; no reproduce todo el contenido técnico de los documentos ni acredita la arquitectura desplegada.** Tener un enlace a un informe tampoco significa que sus hallazgos estén explicados dentro de la presentación.

## 1. Método y alcance de esta revisión

Se contrastaron el [PowerPoint original conservado](<referencias/Ecosistema de Caja Mountain 4.pptx>), [sus antecedentes organizados](antecedentes-presentacion-chile.md), [los apuntes del usuario](contraste-apuntes-operacion-chile.md), los [nueve repositorios analizados](analisis-repositorios/README.md), la propuesta y sus ampliaciones con `presentation/app.js`, `content.js`, `technical-data.js`, `technical-ui.js`, `dataflows-data.js`, `dataflows-ui.js`, `operations-data.js`, `operations-ui.js` y las fuentes Mermaid. Se cotejaron además el [catálogo de integraciones](catalogo-integraciones-actuales.md) y las [vistas técnicas](vistas-arquitectura-y-flujos.md). La revisión distingue correspondencia de contenido, navegación implementada y validación operativa; son verificaciones diferentes.

El PowerPoint contiene **15 diapositivas**. Se extrajeron textos, tablas y notas mediante las relaciones reales entre láminas y notas, y se inspeccionó visualmente el diagrama incrustado en la diapositiva 5. La copia del repositorio coincide por SHA-256 con el archivo original entregado. No se afirma haber revisado visualmente cada elemento decorativo ni haber validado sus datos en producción.

Las notas del presentador se trataron como información, incluidas sus contradicciones; sus instrucciones de exposición no se adoptaron como solicitudes del usuario. Los informes de código remiten a commits concretos: `main` probable no equivale a despliegue confirmado, y varios repositorios legados usan `master`. No se ejecutaron aplicaciones, lectores ni servicios corporativos para esta auditoría.

La ampliación de interacciones incorpora además `presentation/interactions-current.js`, `interactions-extensions.js`, `interactions-proposed.js`, el renderer `interactions-ui.js` y `interactions.css`. Se relaciona con la [guía del visor](visor-interacciones-componentes.md), el catálogo, D01–D05 y O03. Es una representación nativa HTML/SVG de evidencia y contratos seleccionados; no añade una auditoría de servicios reales. La sección 10 detalla su correspondencia y sus límites.

Las matrices distinguen el recorrido principal del detalle accesible en **Ecosistema → Evidencia**. Ecosistema ofrece Vista general como entrada, además de Repositorios, Peticiones y Evidencia; solo se muestra una perspectiva a la vez. La sección 6 ubica las ampliaciones y la sección 8 separa lo que se mantiene en documentos de los pendientes de evidencia. Una acción editorial no autoriza cambios en sistemas productivos.

## 2. Niveles de lectura y significado de cobertura

| Nivel | Cómo usarlo | Qué debe permitir entender |
| --- | --- | --- |
| Recorrido guiado | Capítulos, pasos manuales y laboratorios de la web. | La historia de una venta, las responsabilidades principales y los límites de lo propuesto. |
| Exploración | Pestañas, fichas, diagramas ampliados, tablas y comparaciones. | Dependencias de una pieza, lectura/escritura, modalidad de integración y comportamiento ante fallos. |
| Revisión técnica | Documentos enlazados, contratos y evidencias por commit. | Condiciones exactas, estados/tablas, riesgos, hipótesis, pruebas y trabajo pendiente. |
| Validación operativa | Evidencia que debe aportar el equipo. | Qué versión está instalada, dónde corre, quién la opera y qué garantías se han demostrado. |

**Resumen** significa que la idea está explicada, pero se omiten mecanismos. **Detalle** significa que existe una ficha, secuencia o tabla específica; sigue sujeto a sus límites. **Enlace** significa que hay que salir al documento para conocer el tema. **Ausente** significa que no se encontró una explicación específica en la web revisada; puede estar documentado en el repositorio. No se calcula un porcentaje: las unidades —láminas, hallazgos, servicios y requisitos— no tienen el mismo peso.

Los ocho capítulos de referencia son: [1 Ecosistema](../presentation/index.html#mapa), [2 Venta](../presentation/index.html#venta), [3 Datos](../presentation/index.html#datos), [4 Offline](../presentation/index.html#offline), [5 Propuesta](../presentation/index.html#propuesta), [6 Evolución](../presentation/index.html#evolucion), [7 IA](../presentation/index.html#ia) y [8 Repaso](../presentation/index.html#repaso). Los nombres entre comillas en las matrices identifican fichas o controles; los IDs ayudan a mantener trazabilidad editorial.

La [entrada de la presentación](../presentation/README.md#recorrer-la-presentación) orienta la lectura por capítulo y la [guía del visor](visor-interacciones-componentes.md) concentra controles y accesos directos. Esta matriz describe cobertura y evidencia, no reproduce esas instrucciones.

## 3. PowerPoint original: correspondencia de las 15 diapositivas

Fuente documental común de esta matriz: [antecedentes de Chile](antecedentes-presentacion-chile.md). Sus afirmaciones se contrastan después con los informes de código; la imagen histórica se conserva sin modificar.

| Fuente original | Evidencia o tema que debe conservarse | Dónde está documentado | Web y grado de cobertura | Tratamiento y límite |
| --- | --- | --- | --- | --- |
| 1 · Portada | Alcance: arquitectura, datos, integraciones y dependencias. Sin notas técnicas. | Antecedentes §1. | Cap. 1–6: **resumen** del alcance. | No hace falta una copia de la portada. Mantener fecha y alcance de evidencia. |
| 2 · Resumen ejecutivo + notas | Sucursal distribuida; AX posterior; seis aplicaciones y tres motores; dependencias online. | Antecedentes §§3–4; índice de análisis §§3–4. | Cap. 1/2/4: **resumen**; fichas y Evidencia: **detalle por componente**; discrepancia de conteos por **enlace**. | Repositorio, aplicación, proceso, instancia y motor son unidades distintas; el catálogo no resuelve por sí solo la cifra histórica de seis apps. |
| 3 · Siete módulos + notas | Ofertas, POS, cobranzas, devoluciones, reportes, configuración y tablero de sincronización. | Antecedentes §2; Mountain §1 y MI-06. | Cap. 1 → Evidencia → Fuentes y pendientes: **resumen específico de los siete**, incluido informe Z. | El tablero se distingue del proceso sincronizador. Faltan recorridos funcionales completos y validación de permisos/despliegue. |
| 4 · Cuatro capas + notas | Presentación, negocio/datos, integración y adaptación ERP/externos. | Antecedentes §3. | Cap. 1: **resumen** con agrupación simplificada. | Mantener la lectura por responsabilidades; no convertir cada capa en servidor o microservicio. |
| 5 · Mapa completo + notas | Actores, bases, protocolos, puertos y aclaración de que es un diagrama lógico. | Imagen original; antecedentes §§3/8; informes técnicos. | Cap. 1: **resumen**; fichas de componentes y Evidencia → Rutas/Despliegue: **detalle seleccionado**. | No es una reproducción uno a uno ni inventario físico. Rótulos ambiguos como DATOSAXSQL/QLIKTAIL se conservan en antecedentes y catálogo. |
| 6 · Tienda y central + notas | PC Windows con agentes frente a servidor de sucursal; precio online bloqueante; crédito/fiscalidad externos. | Antecedentes §3; Mountain MI-01/09; vistas V01. | Cap. 1 → Evidencia → Despliegue/V01: **detalle lógico**; fichas describen dependencias. | Hosts, cantidad de instancias y co-ubicación central pendientes. No se atribuyen automáticamente procesos .NET a cada tienda. |
| 7 · Motores y roles + notas | PostgreSQL local/central, SQL Server AX e intercambio, Mongo NC; mensajes, no replicación directa. | Antecedentes §3; índice de análisis §§3–5. | Fichas del mapa y catálogo técnico: **detalle por uso lógico**; contratos/tablas por **enlace**. | Diferenciar motores, usos e instancias. El estado NC y usos Mongo adicionales no se retiran sin identificar su autoridad y consumidores. |
| 8 · Lenguajes + notas | TypeScript/JavaScript, C#, Java/XML y agrupación en seis aplicaciones. | Antecedentes §4; inventarios de cada informe. | Etiquetas tecnológicas de fichas: **resumen**. | Matriz técnica accesible; conservar el alcance de cada versión y la discrepancia de conteos. |
| 9 · Matriz y notas de dependencias | Diez componentes y dependencias declaradas, incluyendo backend concentrador, API lectura y procesador de cola. | Antecedentes §4; inventarios por repositorio. | Evidencia → Fuentes y pendientes → inventario de componentes: **detalle seleccionado de runtime/repos**; matriz completa y lockfiles por **enlace**. | Separar versión de app, framework, rango, lockfile y binario instalado; no presentar versiones declaradas como producción. |
| 10 · Online/diferido + notas | Precio, cliente/saldo/OV/NC, DTE, dispositivos; commit previo al DTE. | Antecedentes §5; Mountain §2; APIs §§4–5. | Cap. 2/3 y fichas: **detalle** para venta/RUT; otras rutas **resumen/enlace**. | Catálogo por operación: origen/destino, espera del usuario, efecto y dependencia. No repetir «todo AX es diferido». |
| 11 · Servicios + notas | Backend, sincronizador, API lectura, administración concentrador, APIs AX y API pagos; «concentrador» ambiguo. | Antecedentes §3; Mountain §1; pagos §1. | Evidencia → inventario de componentes/Despliegue: **detalle por responsabilidad**. | Backend concentrador, API lectura, procesador, broker y WSO2 no se equiparan; el servidor fuente ya está auditado; su despliegue sigue pendiente. |
| 12 · Subida/bajada + notas | Once categorías de transacción, maestros, avisos separados de datos, orden cliente/dirección y venta/pago, horarios. | Antecedentes §5; sincronizador §§3–4; contraste §7. | Cap. 3, `syncpolicy`, Peticiones → sincronización y Evidencia → Rutas: **detalle seleccionado**; V03 y listas completas por **enlace**. | La contradicción del domingo y el significado de los acuses permanecen explícitos. No hay una animación de cada entidad. |
| 13 · Dependencias + notas | Efectos de caída de DB, precio, fiscalidad, AX, broker, lectura, Transbank, cheques y Mongo. Impactos preliminares. | Antecedentes §6; hallazgos de pagos/impresión/Mountain. | Campo offline por ficha, endpoints y ocho casos de cap. 4: **detalle seleccionado**; matriz completa **enlace**. | No se heredan «Mongo bajo» ni «AX medio» como SLA general; impacto por operación y autoridad. |
| 14 · Atención + notas | Integridad, acceso, estados, impresión y deuda tecnológica; red y publicación desconocidas. | Antecedentes §7; informes por commit. | Estados/acuses/casos de fallo: **detalle**; seguridad, paquetes y todos los hallazgos: **enlace**. | Los ejemplos no prueban incidentes o exposición pública; la revisión técnica sigue requiriendo los informes y pruebas. |
| 15 · Cierre | Agradecimiento; sin contenido técnico adicional. | Antecedentes §1. | Cap. 8 ofrece repaso y pendientes. | La sustitución didáctica no omite una decisión técnica. |

### Discrepancias que deben quedar visibles

- La fuente habla de seis aplicaciones, la matriz enumera diez componentes y las notas citan seis AdonisJS donde la tabla identifica cinco. Sigue faltando el inventario de despliegue que reconcilie esas agrupaciones.
- El mapa muestra un «PostgreSQL de caja» dentro del bloque central y APIs .NET bajo «integración sucursal». Esa ubicación gráfica no confirma instancias físicas adicionales ni procesos .NET por tienda.
- La imagen declara API pagos `3386`; el código define `3366` configurable. La imagen indica HTTPS/JWT hacia dispositivos; la impresión inspeccionada usa HTTP local y no aplica los handlers de token comentados. Ambas evidencias se conservan con su origen.
- La nota del domingo en la diapositiva 12, la ventana informada por el usuario y las compuertas del código difieren. AMQP, manuales y trabajos iniciados no deben asumirse regidos por el mismo cron.
- Las fuentes históricas incluyen Instacheck; el usuario confirmó el 2026-10-02 su retirada y la continuidad de Orsan. La arquitectura actual muestra Orsan como proveedor de verificación de cheques; su contrato y configuración por sucursal siguen pendientes. «QLIKTAIL» es la etiqueta literal del diagrama; no basta para identificar producto, versión, consumo de datos o uso actual.
- «DATOSAXSQL» en la imagen tiene correspondencia nominal con `DatosAXSql` en las bibliotecas revisadas; no confirma su despliegue. WSO2/Synapse, DSS/CAR y broker Andes tienen responsabilidades diferentes. El [contraste ampliado de rótulos y protocolos](antecedentes-presentacion-chile.md#protocolos-rótulos-y-detalles-que-requieren-contraste) conserva también la duplicación gráfica de API pagos y SQL Server, sin contarla como instancias físicas.

## 4. Apuntes y decisiones posteriores: matriz temática

| Evidencia o solicitud del usuario | Documento de referencia | Web observada | Acción o límite que debe conservarse |
| --- | --- | --- | --- |
| Chile AX on-premise; Perú custom; España **Gira** | [Propuesta](propuesta-arquitectura.md), [contraste](contraste-apuntes-operacion-chile.md). | Cap. 6, países: **detalle**. | Mantener asimetría de evidencia; no extrapolar las apps chilenas a los otros países. |
| Offline obligatorio y arquitectura distribuida ya existente | [Propuesta](propuesta-arquitectura.md), [resiliencia](revision-resiliencia-datos-pos.md). | Cap. 1/4/5: **detalle didáctico**. | Perfil WAN con escritor de sucursal; el laboratorio no prueba autonomía LAN ni aprobación de pagos/fiscalidad. |
| Venta, DTE y registro AX separados; inventario reservado y deuda posterior | [Mountain](analisis-repositorios/mountain-implementos.md), [contraste](contraste-apuntes-operacion-chile.md). | Cap. 2: **detalle** de tiempos/estados. | La reserva externa queda por identificar; persistir pagos no acredita autorización bancaria ni liquidación. |
| Envíos aproximadamente cada minuto, reintentos más lentos | [Sincronizador](analisis-repositorios/mountain-sync-sucursal.md). | Cap. 2 y `sync`: **resumen**. | Cron, demoras, límites y selección exacta quedan en detalle técnico; no presentarlos como SLA. |
| Caja no maneja stock | [Contraste, AP-01](contraste-apuntes-operacion-chile.md). | Cap. 1/2/6/7: **explícito**. | Una ruta de inventario presente en código no invalida el alcance operativo informado; confirmar su uso. |
| AX → MPOS SQL, posible servidor AX y job diario | [Contraste, AP-02/03/05](contraste-apuntes-operacion-chile.md). | Cap. 3, diagrama discontinuo y `mpos`: **detalle de incertidumbre**. | Pedir DDL, productor, job, host lógico y configuración; no completar flechas por suposición. |
| Refresco de cliente por RUT y convivencia con lotes | [Contraste, AP-04/06](contraste-apuntes-operacion-chile.md), MI-09. | Cap. 3, recorrido RUT: **detalle**. | Distinguir búsqueda local/carga, contactos y error que puede limpiar la venta; no afirmar escritura AX. |
| Ofertas hoy de lectura; motor de ofertas local requerido | [Mountain, MI-01/06](analisis-repositorios/mountain-implementos.md), [propuesta](propuesta-arquitectura.md). | Cap. 5, comparación y `offers`: **resumen**. | Añadir el contraste: CRUD existe en el snapshot, uso productivo no confirmado, cálculo activo remoto. Administración y evaluación son capacidades distintas. |
| Naming de schemas/tablas y código, ACL y fachadas | [Índice, §6](analisis-repositorios/README.md), [propuesta](propuesta-arquitectura.md). | Cap. 6/glosario: **resumen**. | Ejemplos semánticos y migración compatible por **enlace**; no renombrar AX ni consumidores de SQL sin inventario. |
| Posible ERP común comenzando por Chile | [Revisión corporativa](revision-arquitectura-corporativa.md), [resiliencia](revision-resiliencia-datos-pos.md), [V06](vistas-arquitectura-y-flujos.md). | Cap. 6: **resumen**; cap. 4: caso de venta tardía; V06 por **enlace**. | Destino persistido, históricos y rollback requieren el documento y pruebas; fecha/producto sin aprobar. |
| NestJS/Fastify, Pino, Sentry, Tauri, Nx y monolito modular | [Opciones tecnológicas](opciones-tecnologicas.md), [aportes corporativos](analisis-repositorios/aportes-plataforma-corporativa.md). | Cap. 5/6, fichas/glosario: **resumen**. | Mostrar candidatos con condiciones; Tauri no crea offline ni obliga a reescribir un SDK .NET. |
| Reutilización de `core` y `devops-platform` | [Recomendación vigente](propuesta-arquitectura.md#reutilización-de-core-y-devops-platform) y [evidencia corporativa](analisis-repositorios/aportes-plataforma-corporativa.md). | Cap. 5 → Tecnología: **resumen y fichas** de bibliotecas, APIs centrales y entrega, con límites y fuentes; evidencia de la relación CI/CD. Sin tarjetas en cap. 1 ni repetición del bloque en cap. 6. | Distinguir código incluido en la sucursal, servicios centrales y acciones de entrega. Paquetes, contratos y versiones por seleccionar y validar; la venta offline no depende de esos servicios centrales. |
| Ventana Chile y mantenimiento de sábado | [Contraste, AP-08/09](contraste-apuntes-operacion-chile.md), [resiliencia](revision-resiliencia-datos-pos.md). | Cap. 3 → D02/D03 y cap. 5 → Qué cambia, con ficha `syncpolicy`: **detalle conceptual**. | Jobs, bases intervenidas, drenaje, zona IANA y festivos siguen pendientes. |
| WSO2, RabbitMQ, BullMQ y simplificación de bases | [Mensajería](investigacion-mensajeria-pos.md), [revisión corporativa](revision-arquitectura-corporativa.md). | Cap. 5 → Tecnología/Qué cambia, fichas y comparaciones: **detalle conceptual**. | Mantener transporte frente a mediación; no tratar una base intermedia como réplica completa del ERP ni retirar autoridad NC sin migrarla. |
| Crecimiento y número de sucursales | [Cobertura pública](cobertura-publica-sucursales.md). | Cap. 6: **resumen con enlace**. | 31/12/3 son entradas publicadas a la fecha, no cajas/TPS ni prueba de despliegue POS. |
| Facturadores, impresoras y terminales variables | [Extensibilidad](extensibilidad-proveedores-dispositivos.md). | Cap. 6 → Proveedores y equipos, escenarios y mapa: **detalle didáctico**. | Hardware/modelos reales pendientes; binding por operación y recuperación no se prueban mediante la simulación. |
| Servicios de IA útiles al POS | [Servicios IA](servicios-ia-pos.md). | Cap. 7, siete casos y laboratorio: **detalle didáctico**. | Voz futura, fórmula de costes y evaluación completa quedan por **enlace**. No falta un piloto aprobado: los dos son candidatos. |
| RFID, conteos rápidos y posible autoservicio | [Evolución RFID](evolucion-rfid-autoservicio.md). | Cap. 6 → RFID, escenarios y laboratorio: **detalle didáctico**. | La demo no prueba radio, existencia física completa, exclusión real ni integración de inventario. |
| Presentación para juniors con diagramas animables y antes/propuesta | [README de la presentación](../presentation/README.md), [criterios de contenido](../presentation/CONTENT_NOTES.md). | Ocho capítulos, mapas, comparaciones, ejercicios: **implementado en material didáctico**. | La ampliación debe añadir niveles de detalle navegables sin convertir toda la documentación en texto principal. |
| Información que pedir al equipo y calidad enterprise | [Solicitud](solicitud-informacion-equipo.md), [validación](validacion-y-decisiones.md). | Cap. 8: veinte ejercicios de comprensión; seis preguntas para el equipo y **enlace** al paquete completo. | El repaso no acredita aceptación productiva ni cobertura de todos los casos límite. |
| Decisiones con motivo, coste, dueño y evidencia de cierre | [ADR-01–12 de la propuesta](propuesta-arquitectura.md#decisiones-de-arquitectura). | Cap. 5/6: principios **resumidos**; Evidencia → Fuentes y pendientes: **enlace** a la tabla de decisiones. | Todos los ADR siguen propuestos. No se representa cada alternativa, coste y condición en una ficha propia de la web. |

## 5. Código: qué se explica y qué requiere abrir el informe

Cada fila remite a evidencias fijadas al commit en el documento indicado. Esta matriz revisa representación editorial; no repite ni amplía la auditoría estática de los repositorios.

| Informe y evidencia importante | Web y grado de cobertura | Detalle que requiere revisión técnica |
| --- | --- | --- |
| [Mountain](analisis-repositorios/mountain-implementos.md): tres apps; commit antes DTE; precio remoto; CRUD de ofertas; caché NC; rutas/SQL; cliente RUT. | Venta/precios/RUT: **detalle**; backend concentrador y rutas en Evidencia. CRUD de ofertas, transacciones y seguridad completa: **enlace**. | Diferenciar consulta de oferta, edición y evaluación; conservar trazas y riesgos por informe. La ficha de una app no acredita todas sus rutas. |
| [Sincronizador](analisis-repositorios/mountain-sync-sucursal.md): estados por entidad, filtros fiscales, avisos/lotes, ACK temprano, locks, calendario y reintentos. | Cap. 2/3/5, Peticiones → sincronización y rutas: **detalle seleccionado**; V03 y condiciones exactas por **enlace**. | «Preparado» aún no confirma AX. La ventana de fallo del ACK necesita prueba; no afirma pérdida ocurrida ni cola no durable. |
| [Consulta de pagos](analisis-repositorios/api-pagos-caja.md): fan-out SQL a sucursales; NC con escrituras; errores parciales; `3366` configurable. | Ficha `payments`: **resumen**; V01, ficha técnica y rutas: **detalle seleccionado**. | `/pagosSinSinc` filtra pagos con NC bajo condiciones, no todos los pendientes. Revisar predicados SQL y distinguir «sin datos» de «tienda no respondió». |
| [Impresión](analisis-repositorios/api-impresion-caja.md): HTTP local, éxito ambiguo, ausencia de journal, GET con efecto, MICR y formatos locales. | `devices` y propuesta de agentes: **resumen**; Evidencia diferencia app de impresión, rutas y Transbank. Implementación completa por **enlace**. | Acuse de spooler no demuestra impresión física; prueba de salud debe carecer de efectos. La API de pagos revisada no es el agente Transbank. |
| [APIs corporativas](analisis-repositorios/apis-implementos.md): nueve proyectos web/tres bibliotecas; WCF/SQL; precios Mongo/AX; ApiCarro→concentrador; respuestas parciales. | `axapi`/`pricing`: **resumen**; V01 y rutas seleccionadas: **detalle**; inventario completo por **enlace**. | Contrato parecido no demuestra el binding productivo del consumidor. Conservar proyectos ajenos al POS y despliegues no confirmados. |
| [Core](analisis-repositorios/core.md): Nx/Nest/Fastify, módulos/workers, outbox transaccional acotada, fallos de retry/identidad, precios remotos y recomendaciones. | Cap. 5/6/7: **resumen**. Pruebas por ruta y límites: **enlace**. | Conservar qué se reutiliza y qué debe adaptarse; no declarar offline ni atomicidad universal porque exista una biblioteca. |
| [DevOps](analisis-repositorios/devops-platform.md): SHAs consumidos, canary, escaneo, caché, secretos, artefactos y límites para Windows. | Tarjeta `devops-platform`: **resumen**; hallazgos y gates: **enlace**. | Acceso directo al informe y a criterios de adopción; distinguir entrega central de instalación/rollback en tiendas. |
| [Presentaciones corporativas](analisis-repositorios/integration-presentations.md): fuente de ideas y contraste documental. | **Fuera de la presentación**, por indicación del usuario. El informe se conserva como antecedente del análisis. | No mostrarlo como componente, candidato a reutilización ni conexión de la arquitectura. Sus cifras tampoco son objetivos acordados. |

### Casos técnicos que no deben reducirse a una flecha

| Caso | Dónde está respaldado | Cobertura final y límite |
| --- | --- | --- |
| Pago NC preparado desaparece de la consulta de pendientes antes de confirmarse en AX | Índice de análisis §5; PAG-05 y SYNC-03. | D05, cap. Datos: **detalle guiado** del JOIN, filtros y marca previa a AX. Los pasos manuales destacan la ventana; no simulan un incidente ni prueban doble gasto. El informe conserva el análisis completo. |
| Mongo tiene estado NC, directorio de sucursales/usuarios y usos de precios | Pagos §1; APIs §4.2; índice §4. | D05 aporta **detalle** de cajaSucursales/estadoNC, consumidor y fronteras; precios conserva resumen y **enlace**. No se afirma que todos compartan instancia ni que Mongo sea solo una caché. |
| Acuse de broker, commit receptor, aceptación central y registro ERP | Sincronizador; mensajería §6; resiliencia. | Visor de sincronización, contrato de entrega ERP y caso de ACK perdido: **detalle**; V03/V05 por **enlace**. Garantías de transporte/configuración central y contratos reales siguen pendientes. |
| Comandos a periféricos, efecto externo y resultado incierto | Impresión y extensibilidad §§5–7. | **Detalle propuesto** con simulación; protocolo completo por **enlace**. Mantener journal, binding y consulta solo si el proveedor la soporta. |
| Corte ERP con backlogs, referencias históricas y reentregas tras restore | Revisión corporativa §§7–8; resiliencia §§6–8; V06. | Cap. 4/6: **resumen y casos**; V06 por **enlace**. No hay cambio automático del destino de pendientes; recuperación y migración completas necesitan documentos y ensayos. |
| Localidad lógica no equivale a servidor, ni default a puerto productivo | PPTX5/6; inventarios por repositorio; V01. | V01 y fichas: **detalle de la ubicación lógica y sus límites**. El mapa físico comprobado sigue **ausente por falta de evidencia**, no por omisión del diseño visual. |

## 6. Ampliaciones y ubicación de consulta

Las siguientes piezas añaden profundidad sin agregar una lámina por componente. La ubicación indicada corresponde a la navegación implementada; V01 ofrece ampliación y fichas de componentes desde un único acceso. Sus fuentes y las vistas V02–V06 se consultan en el documento. El nivel **detalle** describe contenido específico, no exhaustividad ni validación productiva.

| Ampliación | Contenido y límite | Ubicación y grado |
| --- | --- | --- |
| Arquitectura C4 propuesta | C1, C2, dos C3 (backend y sincronizador) y despliegue complementario. Responsabilidades, procesos, PostgreSQL, autoridades y contratos de sincronización. | **Propuesta → Arquitectura**: cinco mapas con zoom, fichas, teclado y lista alternativa. [Guía C4](c4-arquitectura-propuesta.md). Es diseño recomendado, no implementación ni topología acreditada. |
| Interacciones entre componentes | Ocho recorridos: seis actuales y dos propuestos. Aplicaciones/bases con componentes internos, conexiones HTTP/SQL/MongoDB/AMQP cuando están acreditadas, fuentes y límites por relación. | Cap. 1 → **Peticiones** y cap. 5 → **Venta y ERP**: detalle navegable mediante componentes y secuencia. Los mapas conceptuales tienen su propia pestaña; ver sección 10. |
| Operación y evolución: O01–O04 | Apertura/arqueo/cierre, precio/oferta, impresión y entrega de versiones; cuatro comparaciones y ocho diagramas actual/propuesto. Fichas para distinguir venta, cobranza, NC y devolución. | **Venta → Apertura, cierre e impresión; Propuesta → Precios y ofertas; Evolución → Despliegue**: detalle seleccionado con excepciones, fuentes y [análisis completo](operacion-caja-y-evolucion.md). No acredita todos los flujos del módulo ni su habilitación productiva. |
| Siete módulos funcionales | Ofertas, POS, cobranzas, devoluciones, reportes, configuraciones y tablero de sincronización; propósito y límite de evidencia. No son siete auditorías funcionales completas. | Cap. 1 → Evidencia → Fuentes y pendientes → «Cobertura de los siete módulos de la presentación original»: **resumen específico**, con fuentes. |
| Catálogo de componentes y rutas | Repositorio, runtime, ubicación lógica, puertos observados, origen/destino de llamadas, ejecución, offline, fallos y fuentes. Es una selección de integraciones relevantes; no un OpenAPI completo. | Cap. 1 → Evidencia → **Rutas** y **Fuentes y pendientes → inventario de componentes**: fichas y filtros de **detalle**. El [catálogo documental](catalogo-integraciones-actuales.md) complementa los contratos. |
| Límites físicos y central | PC Windows, servicios de sucursal, central lógica y externos; diferencia entre localización documentada y despliegue físico probado. | Cap. 1 → Evidencia → **Despliegue (V01)**: un único acceso al **detalle lógico**. Alias de host, número de instancias, HA, co-ubicación y red efectiva siguen pendientes. |
| Tablas dentro de operaciones | D01 venta/DTE, D02 subida/respuesta AX, D03 lotes, D04 cliente/saldo y D05 NC entre bases. Lecturas/escrituras, tablas pulsables, fuentes, estados y límites de transacción. | Cap. 3 → **Datos → De la acción a la tabla**: cinco recorridos, 28 pasos manuales y 58 fichas. El contexto de lotes/RUT se integra en D03/D04; el horario, en D02/D03. No se presenta un resumen paralelo. [Documento canónico](recorridos-datos-tablas.md). |
| Venta y sincronización actuales | V02: precio, commit y solicitud DTE. V03: mensaje, marca local, respuesta AX y ACK anterior al guardado; tabla de subida, bajada y refresco individual. | Cap. 1 → **Peticiones**: recorridos actuales con detalle por conexión; cap. 2/3 mantienen el relato de negocio/datos. V02/V03 por **enlace documental**. |
| Continuidad y estados propuestos | V04: escritor local, autorización y resultado incierto. V05: estados de entrega ERP separados de pago/fiscalidad. | Cap. 4 y contratos del cap. 5: ejemplos y **detalle propuesto**, sin ejecución real. V04/V05 por **enlace documental**. |
| Casos límite | WAN/precios, LAN/escritor, ACK perdido, pago/DTE incierto, mantenimiento, restore central, misma NC y venta tardía tras corte ERP. | Cap. 4 → **Otros fallos y recuperación**: **detalle por escenario**. Distingue evidencia actual de respuesta propuesta. |
| Migración y decisiones | V06: decisión durable del destino ERP; ADR-01–13: motivo, coste, evidencia de cierre y responsable. | Caso de corte ERP y Fuentes y pendientes enlazan a [V06](vistas-arquitectura-y-flujos.md#7-v06--actividad-propuesta-elegir-destino-durante-la-migración-erp) y [decisiones de arquitectura](propuesta-arquitectura.md#decisiones-de-arquitectura): **enlace**, sin exponer todas las decisiones en pantalla. |
| Trazabilidad y discrepancias | PPTX/apuntes/código/propuesta, componentes no recibidos, fuente y alcance de cada dato. | Cap. 1 → Evidencia → **Fuentes y pendientes**: **resumen y enlaces** a esta matriz, catálogo, vistas, informes, decisiones y solicitud al equipo. Los conteos son registros del catálogo, no porcentajes. |

Las [vistas V01–V06](vistas-arquitectura-y-flujos.md) conservan el relato técnico completo. **V01 se muestra una sola vez en Evidencia → Despliegue; V02–V06 se consultan en el documento.** El caso «Misma NC en dos cajas» explica el problema de autoridad. D05 añade el JOIN de `/pagosSinSinc`, sus filtros y la marca anticipada en un recorrido guiado; los informes conservan el análisis completo. Las tres ramas de D05 no se presentan como un pipeline obligatorio ni como una transacción común.

## 7. Lo que ningún diagrama puede confirmar sin el equipo

Solicitar los paquetes [E01–E20 y decisiones Q01–Q10](solicitud-informacion-equipo.md) según corresponda. Para convertir la vista lógica en inventario físico verificable, cada componente necesita los campos siguientes, sin copiar credenciales a la presentación:

| Grupo de campos | Datos requeridos | Quién debe validarlos |
| --- | --- | --- |
| Identidad y propiedad | Nombre inequívoco, función, repositorio, dueño técnico/negocio, país/entidad y ambiente. | Responsable de app e integración. |
| Despliegue | Commit o hash de artefacto, versión de app/runtime, sistema operativo, servicio/proceso/contenedor, cantidad de instancias y método de arranque. | Plataforma y soporte. |
| Ubicación y red | PC, servidor de sucursal, VM/host central o servicio cloud; zona/red, proxy/balanceador, dirección de la conexión, protocolo y puerto efectivo. | Infraestructura/redes. |
| Persistencia | Motor, instancia/base/schema o colección, propietario de escrituras, consumidores SQL directos, volumen, retención, backup y prueba de restore. | DBA y dueño de datos. |
| Ejecución y recuperación | Cron/TZ/calendario por flujo, concurrencia, dependencia causal, ACK, reintento, consulta de resultado, retención y conciliación. | Integración y operaciones. |
| Dependencias y capacidad | Servicio/dispositivo requerido, permisos, vigencias, comportamiento sin WAN/LAN, salud real, picos y backlog. | Operaciones y responsables de proveedores. |

Pendientes prioritarios: artefactos y configuración desplegados de WSO2/Andes/API de lectura/procesador; AX/X++ y procedimientos; ubicación/jobs MPOS; emisor/adquirente/agente Transbank y modelos instalados; topología y contratos de Perú/España; versión y permisos reales de ofertas; autoridad de NC/inventario; calendario efectivo; procedimientos de mantenimiento y restauración.

Para revisar la cobertura con el equipo, tomar una operación real sanitizada y recorrer **persona → app → base → integración → proveedor/ERP → respuesta**. En cada flecha preguntar qué dato cruza, quién puede escribir, qué confirma el acuse y qué ocurre si se pierde la respuesta. Si falta un responsable, contrato o evidencia, marcarlo pendiente; una flecha completa en Mermaid no lo resuelve.

## 8. Cierre editorial y límites de la entrega

La ampliación cierra vacíos editoriales de componentes centrales, siete módulos funcionales, repositorios, puertos, rutas seleccionadas, ubicación lógica y significado de estados/acuses. D01–D05 añaden el detalle de las tablas dentro de operaciones, con esquemas explícitos donde los declara el código y límites transaccionales por paso. También incorpora casos de fallo sin confundir lo que hace el código actual con el contrato propuesto. La ficha de API de lectura incorpora receptor, recuperación y acuses revisados en mountain-concentrador; Mongo explicita NC/directorios/precios sin asumir una instancia; Orsan se muestra vigente e Instacheck retirado, según la confirmación del usuario del 2026-10-02.

El contenido siguiente **sigue exigiendo abrir documentos**. Tenerlo enlazado es una decisión de profundidad de lectura, no cobertura visual íntegra:

| Detalle que no se reproduce íntegramente en pantalla | Dónde consultarlo |
| --- | --- |
| Texto, tablas y notas de las 15 láminas, versiones declaradas y discrepancias de agrupación. | [PPTX original](<referencias/Ecosistema de Caja Mountain 4.pptx>) y [antecedentes](antecedentes-presentacion-chile.md). |
| Cada hallazgo por commit, predicados SQL, ramas, lockfiles, permisos y todos los consumidores/riesgos de los nueve repositorios. | [Informes de repositorios](analisis-repositorios/README.md). El catálogo web selecciona rutas; D01–D05 seleccionan operaciones/tablas y filtros críticos. No constituyen inventarios completos de APIs ni un ERD físico. |
| V02–V06, tablas de contrato y criterios de evidencia que acompañan los seis diagramas. | [Vistas de arquitectura y flujos](vistas-arquitectura-y-flujos.md). V01 tiene un único acceso web en Evidencia → Despliegue. |
| Trece ADR con costes/condiciones, alternativas de stack, dimensionamiento por carga y análisis de mensajería/autoridad de bases. | [Propuesta](propuesta-arquitectura.md#decisiones-de-arquitectura), [opciones](opciones-tecnologicas.md), [revisión corporativa](revision-arquitectura-corporativa.md) y [mensajería](investigacion-mensajeria-pos.md). |
| Protocolo durable de periféricos, binding histórico, restore, aislamiento del escritor y aceptación de todos los casos. | [Extensibilidad](extensibilidad-proveedores-dispositivos.md), [resiliencia](revision-resiliencia-datos-pos.md) y [validación](validacion-y-decisiones.md). Los ocho casos web no sustituyen estas matrices. |
| Evaluación y costes IA, voz futura; radio/etiquetado, conteos y fases del piloto RFID. | [Servicios IA](servicios-ia-pos.md) y [RFID/autoservicio](evolucion-rfid-autoservicio.md). Son oportunidades sin aprobación ni implementación corporativa acreditada. |
| Paquetes completos E01–E20, decisiones Q01–Q10 y plantilla de respuesta del equipo. | [Solicitud de información](solicitud-informacion-equipo.md). El repaso junior resume solo las conversaciones iniciales. |

Se conservan el PowerPoint y [la imagen original](referencias/arquitectura-original-chile.jpeg), antecedentes, apuntes contrastados, informes por commit, propuesta y ampliaciones, [fuentes y guía de la presentación](../presentation/README.md). La comprobación documental verificó correspondencias sobre archivos y enlaces locales; la revisión visual e interacción se registra con las comprobaciones de la presentación. Las animaciones son explicaciones sintéticas y no sustituyen pruebas en sistemas reales.

**Estado del cierre:** cobertura editorial ampliada y trazable, con distintos niveles de detalle. No se afirma que esté expuesta cada frase de cada fuente, que se hayan auditado todos los endpoints o módulos, ni que la topología y las garantías estén confirmadas en producción. Los vacíos de evidencia se conservan como tareas concretas para el equipo en lugar de completarlos con supuestos.

## 9. Relectura operativa y corporativa

La ampliación [Operación de caja y evolución](operacion-caja-y-evolucion.md) vuelve a las 15 láminas/notas y a fragmentos de los snapshots. O01 distingue sesión, arqueo, cierre con diferencias y registro ERP; explica prevalidaciones con efectos y escenarios de concurrencia. O03 separa DTE, representación, canal y acuse de impresión. Las cuatro fichas de Venta distinguen compra actual, cobranza de deuda anterior, aplicación de NC y devolución de dinero. El caso de Offline se denomina «Fin de ventana de sincronización y mantenimiento» para evitar confundirlo con el cierre del operador.

O02 profundiza en el contexto de cálculo y la diferencia observada del endpoint de precios por lote; conserva el binding productivo como pendiente y el uso de ofertas solo lectura informado. O04 contrasta activos de core/DevOps con actualización de sucursales, esquema, identidad de eventos y compatibilidad entre versiones. No se declara que el despliegue Cloud Run sea un actualizador de tiendas ni que AX/mock cubran Perú/España.

Los **ocho diagramas O01–O04** y sus escenarios sí están representados en la web. El detalle de permisos offline, todas las observaciones sobre archivos de custodia, los contratos completos de cobranza/reembolso y cada criterio de adopción continúan ampliados mediante documentos. El ciclo completo del informe Z, las variantes de operación y los permisos/contratos reales todavía necesitan evidencia del equipo.

## 10. Visor nativo de interacciones

Los ocho capítulos se conservan. Ecosistema abre Vista general; Propuesta abre Arquitectura. Sus recorridos se consultan en Peticiones y Venta y ERP, respectivamente, sin otro acordeón de entrada. Venta, Offline y Evolución también separan bloques independientes en pestañas; al alternar dentro del capítulo se mantienen las selecciones. Datos concentra sus cinco recorridos en un solo explorador, comenzando en D03. IA y Repaso mantienen sus recorridos. La [guía canónica del visor](visor-interacciones-componentes.md) describe acceso, controles y convenciones; esta sección conserva la correspondencia con las fuentes.

| ID / estado | Qué se representa en pantalla | Fuentes y límites conservados |
| --- | --- | --- |
| `sale` · actual | Aplicaciones que reciben la venta, tablas de persistencia y llamadas de facturación. | [D01](recorridos-datos-tablas.md), catálogo y fuentes por SHA. Commit, resultado fiscal y registro ERP siguen separados. |
| `sync` · actual | Preparación, envío y respuesta de sincronización, con llamadas entre aplicaciones y consultas a sus tablas. | D02, V03 e informes. No se equiparan marca local, recepción del bus y confirmación AX. |
| `masters` · actual | Avisos, lectura de maestros y aplicación en tablas locales. | D03, lector MPOS, generador central y API lectura auditados. Productor AX→MPOS y topología efectiva pendientes. |
| `customer` · actual | Consulta de cliente por RUT y actualización local. | D04 y catálogo. No se dibuja una escritura AX ni se presume una consulta remota operativa sin conectividad. |
| `printing` · actual | PDF, API de impresión Windows y alternativa ePOS; implementación interna en las fichas. | O03 y [análisis de impresión](analisis-repositorios/api-impresion-caja.md). No se conecta PDF como requisito universal del canal térmico ni se convierte HTTP 200 en acuse físico. |
| `credit` · actual | Consulta y ajuste de saldo, marcas `estadoNC` y registro del pago local como ramas separadas. | D05 y [análisis de pagos](analisis-repositorios/api-pagos-caja.md). No se inventa caller de POST/PUT ni transacción común MongoDB/PostgreSQL/ERP. |
| `proposed-sale` · propuesta | Intención durable, condiciones de pago/fiscalidad, observaciones y commit de negocio/outbox. | [Propuesta](propuesta-arquitectura.md#confirmación-local-de-una-venta), extensibilidad y guía del visor. Nombres de datos ilustrativos y capacidades por homologar; no implementación instalada. |
| `proposed-erp` · propuesta | Entrega, inbox/efecto local, ACK de custodia, binding, worker/ACL y conciliación. | [Propuesta](propuesta-arquitectura.md#sincronización-y-consistencia), resiliencia y guía del visor. Una inbox no garantiza exactamente una aplicación del efecto externo; resultado incierto y corte de ERP conservan sus reglas. |

El nivel es **detalle seleccionado**: se pueden consultar contrato, efecto, frontera y fuentes. Las clases internas permanecen en las fichas; un grupo no acredita servidor, proceso desplegado ni ubicación física. Los contratos futuros no son rutas existentes y una secuencia didáctica no es una transacción global.

El [manual de mantenimiento](../presentation/README.md#verificar) reúne comandos y alcance de QA. La matriz no anticipa un resultado aprobado ni extiende pruebas de interfaz a los sistemas corporativos.

## 11. Ampliación mountain-concentrador · 2 de octubre

| Evidencia nueva | Documento | Presentación | Límite |
| --- | --- | --- | --- |
| Ocho repositorios de software y once relaciones | [Mapa cruzado](mapa-repositorios-y-conexiones.md) | Ecosistema → Repositorios: seis repositorios del POS actual y diez relaciones. Propuesta → Tecnología: fichas de core/devops-platform y su relación CI/CD. Unidades y fuentes al inspeccionar. | El bloque de reutilización pertenece a Propuesta; no se repite en Evolución ni se mezcla con el mapa actual. No es inventario físico. Las fuentes de ideas se conservan aparte en la documentación. |
| Ingreso, cola, Java, .NET y respuesta AX | [Auditoría de ingreso](analisis-repositorios/mountain-concentrador-ingreso.md) | Recorrido sync, V03 y D02 ampliados. | Consumidores alternativos y commits separados; despliegue sin validar. |
| MPOS, lotes, acuses y recuperación | [Auditoría de maestros](analisis-repositorios/mountain-concentrador-maestros.md) | Recorrido masters, D03, fichas y endpoints actualizados. | Productor AX→MPOS, SP/DDL y job diario pendientes. |
| Decisión de evolución WSO2 | [Síntesis central](analisis-repositorios/mountain-concentrador.md) | Fuentes enlazadas desde mapa y componentes. | El inventario exhaustivo de SQL/mediadores permanece en los informes. |

## 12. Auditoría editorial y fuentes canónicas

La revisión del 2 de octubre abarcó documentación y presentación, sin volver a auditar clones. Se conserva la repetición necesaria entre **fuente**, **síntesis para presentar** y **evidencia para verificar**. El problema principal es la redundancia semántica y la actualización manual en varios lugares. No se detectaron duplicados textuales exactos de al menos doce palabras en la captura inicial de los capítulos examinados; eso no descarta repeticiones reformuladas ni contenido repetido al abrir fichas.

### Fuente que gobierna cada tema

| Tema | Fuente canónica | Papel de las otras vistas |
| --- | --- | --- |
| Requisitos y aclaraciones del equipo | [Contexto y requisitos](https://github.com/floxcristian/pos-architecture/blob/7ff835f440fece2f2d8f32efff9c08ad93e50308/README.md#1-objetivo-y-alcance); [apuntes contrastados](contraste-apuntes-operacion-chile.md) para las precisiones de Chile. | La presentación resume; los antecedentes originales conservan lo que se informó en cada fuente, incluidas discrepancias. |
| Hallazgos de código y límites del snapshot | [Informe de cada repositorio](analisis-repositorios/README.md), con SHA, ruta y líneas. | Índices, catálogo y mapas seleccionan hallazgos; no sustituyen su evidencia ni acreditan producción. |
| Inventario y contratos actuales | [Catálogo de integraciones](catalogo-integraciones-actuales.md) y [mapa de repositorios](mapa-repositorios-y-conexiones.md). | Fichas web representan componentes/rutas de esos inventarios; topología física continúa pendiente. |
| Orden, tablas y fronteras de los recorridos | [D01–D05](recorridos-datos-tablas.md), [operación O01–O04](operacion-caja-y-evolucion.md) y [vistas V01–V06](vistas-arquitectura-y-flujos.md), según la pregunta. | Mermaid derivado conserva su origen; datos narrativos y conexiones de la web son síntesis manuales que deben contrastarse al cambiar el contrato. |
| Recomendación objetivo y decisiones | [Propuesta y ADR](propuesta-arquitectura.md#decisiones-de-arquitectura), todavía por aprobar. | Revisiones explican motivos, alternativas y objeciones; documentos especializados desarrollan capacidades bajo esa decisión. La guía del visor explica ejemplos del objetivo. |
| Evidencia por obtener y aceptación | [Solicitud al equipo](solicitud-informacion-equipo.md) para preguntas/evidencias; [validación](validacion-y-decisiones.md) para aceptación. | Resiliencia y documentos especializados detallan casos adversos. Los laboratorios web seleccionan ejemplos y no ejecutan esas pruebas. |
| Uso y mantenimiento del tutorial | [Guía del visor](visor-interacciones-componentes.md) para sus controles; [entrada de la presentación](../presentation/README.md) para apertura, capítulos y mantenimiento. | El README raíz orienta y enlaza. Esta matriz registra cobertura; no mantiene otro manual de controles. |
| SVG y diagramas derivados | Mermaid documental de D/V/O y fuentes conceptuales indicadas en el [manual](../presentation/README.md#editar-el-contenido). | Las copias `.mmd` generadas y `diagrams.js` son artefactos de entrega, una duplicación necesaria para abrir offline; no se editan como una fuente alternativa. |

### Hallazgos y cambios de esta entrega

| ID | Antes / riesgo observado | Después / tratamiento |
| --- | --- | --- |
| ED-01 · Estado actual repetido y desfasado | El README decía que WSO2/Java/api-lectura/procesador no estaban localizados, mientras su ampliación ya incorporaba mountain-concentrador. | Se corrigió la afirmación en su lugar. Los pendientes reales son artefactos instalados, bindings y el agente Transbank no recibido; las auditorías históricas se conservan identificadas. |
| ED-02 · Aceptación fuera de su perfil | La fila de pérdida de LAN/nodo pedía continuidad de caja sin separar el perfil WAN del ampliado por terminal, a diferencia de la propuesta. | La aceptación distingue ambos perfiles y enlaza el comportamiento canónico: WAN requiere acceso al escritor; autonomía por terminal necesita aprobación y garantías propias. |
| ED-03 · Varios manuales para los mismos controles | README raíz, guía web, guía del visor y matriz describían repetidamente modos, zoom, reproducción y teclado. | La guía del visor concentra controles; la entrada web conserva apertura/capítulos/mantenimiento y la matriz solo trazabilidad. Las pestañas separan bloques independientes; los contratos propuestos tienen su panel y Datos conserva un solo explorador que empieza en maestros. |
| ED-04 · Hechos mantenidos en varios datasets | `content.js`, `technical-data.js`, `dataflows-data.js` e `interactions-*.js` repiten selección de hechos, fuentes y límites. Los diagramas documentales se generan, pero esos relatos no. | Se documenta la dependencia y permanece pendiente una fuente compartida para hechos reutilizados. No se elimina una perspectiva útil ni se afirma que las pruebas de IDs/enlaces comprueben equivalencia semántica. |
| ED-05 · Dos documentos podían parecer autoridad de diseño | Propuesta y revisión corporativa presentan recomendaciones y diseños completos; el lector podía interpretar la revisión más reciente como una segunda versión objetivo. | Ambos encabezados explicitan la jerarquía: propuesta + ADR gobiernan la recomendación; revisiones conservan motivos/alternativas. No se borraron diseños, fuentes ni objeciones. |

### Repetición en pantalla y tratamiento

| Solapamiento | Tratamiento y contenido que debe conservarse |
| --- | --- |
| Cinco recorridos en Interacciones y Datos: D01/sale, D02/sync, D03/masters, D04/customer y D05/credit. | La pestaña Peticiones, los enlaces cruzados y D03 inicial separan las preguntas sin apilar recorridos completos en Ecosistema. Pendiente: compartir relato/estado del recorrido y añadir `schemaEvidence`/`stateFields` como detalle de Datos; no borrar esas evidencias ni forzar una sola perspectiva. [Datos y enlaces cruzados](../presentation/dataflows-ui.js), [datos de recorridos](../presentation/dataflows-data.js). |
| V01 aparecía en Despliegue y también en la biblioteca Diagramas. | Resuelto en navegación: V01 tiene un único acceso en Evidencia → Despliegue. V02–V06 quedan enlazados al documento. El mapa de repositorios frente al despliegue lógico responde preguntas distintas. [Vista técnica](../presentation/technical-ui.js). |
| Fichas de una aplicación en contenido, explorador, interacciones y mapa de repositorios. | Pendiente: datos comunes de aplicación con secciones por responsabilidad, código, ubicación y evidencia. Conservar diferencias entre repositorio, app y host. Dentro de Interacciones ya se evita repetir descripción/límite/fuentes al abrir implementación; los datos auditados siguen disponibles. [Contenido](../presentation/content.js), [catálogo](../presentation/technical-data.js), [vista de interacciones](../presentation/interactions-view-data.js), [repositorios](../presentation/repositories-data.js). |
| Precio/ofertas, stack corporativo y horario reaparecen en laboratorio, comparaciones, fichas y casos operativos. | Mantener una función por contexto: laboratorio muestra efecto; O02 desarrolla precio/ofertas; Propuesta → Tecnología concentra la reutilización de core/devops-platform y Evolución → Despliegue usa O04 para explicar la entrega de versiones; D02/D03 sitúan el horario junto a los flujos afectados. En los demás lugares, síntesis y enlace. El recordatorio local/fiscal/ERP junto a cada efecto, el repaso y las listas accesibles son refuerzo útil, no duplicación a eliminar. [Casos operativos](operacion-caja-y-evolucion.md), [contenido web](../presentation/content.js). |

### Antes y después de la navegación

| Superficie | Antes | Después |
| --- | --- | --- |
| Ecosistema | Los bloques independientes de repositorios, recorridos, mapa conceptual y explorador parecían depender de una selección superior. | Cuatro pestañas y un panel visible: Vista general inicial, Repositorios, Peticiones y Evidencia. Se conservan selecciones al alternar dentro del capítulo; no se promete filtrado cruzado. |
| Venta y Offline | El relato principal y los casos independientes aparecían apilados. | Venta abre su recorrido y separa apertura/cierre/impresión; Offline abre el laboratorio y separa los demás fallos. |
| Propuesta | Comparación, contratos, mapa y opciones técnicas podían parecer dependientes del mismo selector. | Arquitectura inicial y pestañas Qué cambia, Venta y ERP, Precios y ofertas y Tecnología. |
| Evolución | El selector de país precedía migración, proveedores, RFID y despliegue, aunque no los modificaba. | Países inicial y pestañas Cambio de ERP, Proveedores y equipos, RFID y Despliegue. |
| Datos | Otro recorrido de venta como punto de partida y resúmenes adicionales de lotes/RUT. | Maestros D03 por defecto; un explorador D01–D05 con contexto en D03/D04, horario en D02/D03 y enlaces a las llamadas. |
| IA y Repaso | Sus controles sí forman parte del mismo ejercicio. | Se mantienen unidos, sin añadir pestañas. |
| Documentos de uso | Instrucciones del visor repetidas en cuatro entradas. | Manual canónico enlazado, con controles y accesos por pregunta. |

Las mediciones siguientes pertenecen a la revisión anterior, que plegó las bibliotecas; **no miden la navegación posterior por pestañas**. Aquella comparación usó la misma configuración antes y después: escritorio **1440 × 1000** y móvil **390 × 844**. Mide el estado inicial, sin abrir bloques de detalle.

| Capítulo y medida | Antes | Después |
| --- | ---: | ---: |
| Ecosistema · palabras accesibles iniciales en escritorio | 807 | 460 |
| Propuesta · palabras accesibles iniciales en escritorio | 651 | 293 |
| Ecosistema · altos de ventana en escritorio | 4,24 | 2,45 |
| Propuesta · altos de ventana en escritorio | 3,54 | 1,72 |
| Ecosistema · altos de ventana en móvil | 6,69 | 4,21 |
| Propuesta · altos de ventana en móvil | 5,64 | 3,13 |

Es una reducción de **carga inicial**, no del contenido total ni una medición de comprensión. Los informes, contratos, fuentes y recorridos siguen accesibles. La comparación no equivale a un ensayo de usabilidad con personas ni se atribuye a una regla específica recuperada de un catálogo UX. Los registros `presentation/qa/redundancy-before.json` y `presentation/qa/redundancy-after.json`, junto con las capturas de QA, se conservan en el workspace y se excluyen del paquete de entrega.

La comprobación final del visor pasó para ocho recorridos y 128 conexiones, con 144 vistas; también verificó enlaces directos, atrás/adelante, apertura/cierre de biblioteca, pausa, resize, inicio D03 y apertura local. La comprobación de diagramas compactos pasó sus 64 casos. Estos resultados corresponden a la revisión anterior de bibliotecas plegables; no acreditan por sí solos la navegación posterior por pestañas ni prueban aplicaciones corporativas o garantías del POS.

### Trabajo estructural pendiente

- Introducir IDs de hechos y referencias compartidas para componentes, endpoints, estados y límites; hacer que las distintas vistas seleccionen esos datos y conserven su relato didáctico. Unificar los recorridos/fichas relacionados sin perder evidencia de esquema, campos, fuentes ni responsabilidades distintas.
- Relacionar casos R de resiliencia, criterios de aceptación y ejemplos UI mediante IDs estables. Un test de interfaz no satisface una prueba operativa del POS.
- Comprobar impacto editorial al cambiar un hecho/ADR: fuente canónica, síntesis afectadas y afirmaciones sustituidas. Los validadores de enlaces y nodos actuales no resuelven solos esa semántica.
- Registrar nuevos aportes en su fuente correspondiente y en un historial breve, evitando añadir una corrección al final que deje vigente una afirmación incompatible al principio.
