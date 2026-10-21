# Información para cerrar la arquitectura enterprise del POS

Preparado el 1 de octubre de 2026 para responsables de negocio, tecnología y operación de Chile, Perú y España. Complementa la [propuesta de arquitectura](propuesta-arquitectura.md), el [análisis de repositorios](analisis-repositorios/README.md) y las [validaciones](validacion-y-decisiones.md).

## 1. Estado real del trabajo

Ya existe una arquitectura de referencia orientada a operación enterprise: autonomía local, reglas/ofertas locales, persistencia transaccional, sincronización durable, identidades estables, conciliación y separación del ERP mediante contratos y ACL. También existe una revisión del código chileno y un plan de pruebas.

Todavía faltan decisiones para cerrar el diseño de implementación, el dimensionamiento, los costes y la transición. Las 72 horas de autonomía y los valores de disponibilidad, latencia y recuperación del borrador son hipótesis para discutir. No son requisitos acordados ni resultados medidos.

| Frente | Propósito | Entregable y criterio |
| --- | --- | --- |
| Arquitectura objetivo | Definir cómo debe operar el POS de los tres países, incluso al cambiar de ERP. | Límites de dominio, autoridad de datos, contratos, topología, seguridad, operación y decisiones justificadas. |
| Estabilización del sistema vigente | Reducir riesgos de las tiendas mientras continúan operando. | Correcciones verificadas de los problemas actuales; no se consideran por sí solas la arquitectura objetivo. |
| Transición | Llevar datos, tiendas e integraciones hacia el objetivo manteniendo trazabilidad. | Plan de coexistencia, migración, conciliación, corte y retirada de componentes; cada mecanismo temporal tiene responsable y condición de eliminación. |

Interpretamos «sin parches» como resolver las causas estructurales y definir un destino coherente. La reutilización de un componente requiere demostrar que cumple sus contratos y garantías. Su sustitución debe justificarse cuando no los cumple o su coste de evolución/operación no resulta aceptable. No se ha decidido una reescritura total ni conservar obligatoriamente el stack actual.

Las prácticas públicas de referencia ponen el foco en calidad y operación medibles: Google SRE utiliza objetivos de servicio para priorizar fiabilidad; AWS Well-Architected evalúa operación, seguridad, fiabilidad, rendimiento, coste y sostenibilidad. Tomamos esos criterios como guía metodológica, sin prescribir AWS ni atribuir una arquitectura POS única a las grandes tecnológicas. [Google SRE](https://sre.google/workbook/implementing-slos/), [AWS Well-Architected](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html).

## 2. Primer pedido: diez respuestas que condicionan el diseño

Responder **por país** cuando existan diferencias. Para cada ID, indicar respuesta, responsable, evidencia y si describe la situación actual o una decisión sobre el objetivo. Si no se sabe, registrar quién puede resolverlo; no convertir una estimación en dato confirmado.

| ID | Pregunta que debemos resolver | A quién pedirla | Evidencia o respuesta concreta | Decisión que habilita |
| --- | --- | --- | --- | --- |
| Q01 | ¿Qué significa offline: perder Internet, perder también LAN/servidor de sucursal, o ambos? ¿Cuánto debe durar y qué operaciones deben continuar? | Operaciones de tiendas + producto + infraestructura | Matriz de la sección 3; duración máxima requerida, cortes observados y procedimiento actual. | Escritor por sucursal o por caja, almacenamiento, coordinación y coste local. |
| Q02 | ¿Qué situaciones deben impedir una venta y qué riesgo acepta negocio durante la desconexión? | Comercial + finanzas + inventario | Decisión sobre precio vencido, stock incierto, crédito, NC, devoluciones entre tiendas y descuentos; límites por importe/operador y dueño de la decisión. | Autoridad, reservas, cupos, restricciones y conciliación; evita prometer saldos globales sin coordinación. |
| Q03 | ¿Qué documentos y pagos se usan en cada país y qué admiten realmente durante una caída? | Responsables fiscales locales + pagos + proveedores | Sociedades/establecimientos, tipos de documento, proveedores, dispositivos/SDK y documentación de contingencia, consulta, reintento, reversa y homologación. Incluir responsable que confirme cada capacidad. | Flujo de finalización de venta y estados fiscales/de pago; alcance offline vendible. |
| Q04 | ¿Quién es dueño de catálogo, precio, oferta, stock, cliente, crédito, NC y contabilidad? ¿Qué significa exactamente el módulo local de ofertas? | Dueños de negocio + equipos ERP/POS | Matriz dato/atributo → sistema autorizado a cambiarlo → responsable; ejemplos de promociones. Precisar evaluar/aplicar y, si corresponde, crear/editar localmente. | Límites de módulos, distribución de maestros, motor local y manejo de conflictos. |
| Q05 | ¿Qué capacidades e interfaces tienen Gira en España y el custom de Perú, y cuál es el plan del ERP común? | TI por país + programa ERP corporativo | Versión, personalizaciones, capacidades e interfaces de Gira y del custom; versión/personalizaciones AX, ERP destino si está seleccionado, sociedades/instancias, alcance y calendario tentativo. Identificar quién decidirá el tratamiento de pendientes offline, pagos/devoluciones históricos y autoridades por fase durante la coexistencia. | Contratos y adaptadores; inversión reutilizable y estrategia de coexistencia. El producto futuro puede seguir pendiente, pero deben quedar dueño y punto de decisión. |
| Q06 | ¿Cuál es la escala actual y el crecimiento esperado? | Operaciones + analítica + infraestructura + integración | Tiendas y cajas por país, cajas concurrentes, tickets/minuto en pico con ventana de medición, líneas/ticket, catálogo, tamaño de mensajes, datos retenidos y proyección de crecimiento con horizonte explícito. Añadir límites de consumo y capacidad de ERP/proveedores. | Capacidad local/central, particiones, recuperación de backlog y estimación de coste. |
| Q07 | ¿Cuánto tiempo puede detenerse la caja y cuánto dato puede perderse en cada tipo de incidente? | Negocio + operaciones + finanzas + infraestructura | Objetivos separados para caja, sucursal, país, fiscalidad y registro ERP; caída de proceso, pérdida de disco/equipo y pérdida completa de tienda. Latencia aceptable de venta y antigüedad máxima de deuda pendiente. | Objetivos de servicio, copias, recuperación, alertas y presupuesto. RTO = tiempo para recuperar; RPO = pérdida de datos tolerada. |
| Q08 | ¿Qué restricciones de infraestructura, identidad, datos y equipos son obligatorias? | Seguridad + infraestructura + privacidad + equipos de tienda | Aclarar si “No Cloud” aplica solo a AX o al POS completo; opciones de alojamiento, redes, identidad corporativa, políticas de datos y hardware/periféricos disponibles. | Despliegue físico, aislamiento por país/entidad, seguridad local y compatibilidad de dispositivos. |
| Q09 | ¿Qué se ejecuta hoy y qué garantías ofrecen las integraciones centrales? | Desarrollo + DevOps + integración + equipo AX | Mapa componente → repositorio → commit/artefacto → entorno; contratos y fuentes faltantes de la sección 4. Incluir quién confirma registro/contabilización y cómo se consulta una operación incierta. | Verificación de hallazgos, límites de reutilización y migración segura de mensajes/datos. Una rama “probable” no acredita el binario instalado. |
| Q10 | ¿Con qué equipo, presupuesto y restricciones de entrega se cuenta? | Sponsor + liderazgo TI + operaciones + programa ERP | Rango presupuestario, roles y dedicación, tecnologías operables, soporte/guardias, capacidad en tiendas, piloto candidato, fechas impuestas y ventanas permitidas. | Complejidad sostenible, elección de stack, compra/desarrollo y secuencia de POS frente a ERP. |

Q01–Q05 fijan comportamiento y autoridad; Q06–Q08 fijan capacidad y condiciones de operación; Q09–Q10 fijan viabilidad de transición y entrega. Podemos avanzar con hipótesis explícitas mientras se resuelven, pero no comprometer las garantías que dependen de ellas.

**Actualización de contexto:** los directorios públicos consultados el 01-10-2026 listan 31 tiendas en Chile, 12 en Perú y 3 en España ([inventario y fuentes](cobertura-publica-sucursales.md)). Q06 pide reconciliar esa cobertura con sucursales POS efectivas y obtener cajas/carga; no volver a tratar la cifra comercial como TPS. El horario informado de Chile —L–V 07:00–22:00, sábado 07:00–16:00— se conserva como antecedente; Q09/E13 deben resolver las diferencias con las rutas del código revisado.

## 3. Matriz mínima de capacidades offline

Completar una copia por país y, si cambia el negocio, por tipo de tienda. En cada celda indicar **permitida / restringida / bloqueada**, límite de tiempo o importe, dependencia y responsable de la decisión. “Sin Internet” asume LAN y servidor de sucursal operativos; la segunda columna evalúa además el aislamiento de la caja. La matriz expresa requisitos por acordar, no capacidades ya comprobadas.

| Operación | Sin Internet | Caja sin acceso a LAN/servidor de sucursal | Límite y condición para autorizar | Responsable |
| --- | --- | --- | --- | --- |
| Abrir turno e identificar operador | Por definir | Por definir | Por definir | Por asignar |
| Consultar catálogo y calcular precio/oferta | Por definir | Por definir | Por definir | Por asignar |
| Vender y cobrar efectivo | Por definir | Por definir | Por definir | Por asignar |
| Cobrar con tarjeta u otro proveedor externo | Por definir | Por definir | Por definir | Por asignar |
| Vender a crédito | Por definir | Por definir | Por definir | Por asignar |
| Emitir cada tipo de documento fiscal | Por definir | Por definir | Por definir | Por asignar |
| Aplicar una NC o devolver una venta | Por definir | Por definir | Por definir | Por asignar |
| Validar disponibilidad o consumir una reserva, solo si se incluye en el alcance POS | Por definir | Por definir | La caja actual no maneja stock; identificar sistema externo y política requerida | Por asignar |
| Aplicar descuento manual o administrar oferta | Por definir | Por definir | Por definir | Por asignar |
| Cerrar turno y recuperar pendientes | Por definir | Por definir | Por definir | Por asignar |

El equipo debe añadir o separar operaciones si sus reglas cambian: devolución de la misma tienda frente a otra tienda, pago mixto, anulación, retiro, despacho y operaciones omnicanal, cuando formen parte del alcance.

Para requisitos de continuidad, acompañar la matriz con escenarios concretos: “la tienda está sin Internet durante X horas y tiene Y cajas activas”; “se pierde el servidor con Z minutos de ventas todavía no replicadas”. Las letras son campos pendientes, no valores recomendados.

## 4. Paquete técnico complementario

No es necesario volver a entregar los nueve repositorios ya analizados: seis del POS, dos plataformas corporativas y una referencia editorial. Sí necesitamos vincularlos a lo desplegado y completar las piezas siguientes, con ejemplos sintéticos o anonimizados y configuración sin secretos. El usuario confirmó Gira como sistema de España; Q05 solicita sus capacidades, versión e interfaces, sin volver a pedir confirmación del nombre.

| ID | Material solicitado | Contenido mínimo y motivo |
| --- | --- | --- |
| E01 | Inventario de producción y topología | Versiones exactas de aplicaciones, runtimes y bases; procesos por equipo, puertos y flujos, balanceadores, proxies, redundancia, horario/TZ y responsables. Evidencia de artefactos instalados si no se conserva el SHA. |
| E02 | Integración central desplegada y garantías | Contrastar el código ya recibido de WSO2/Synapse/Java, API de lectura y procesador con artefactos y configuración instalados; acreditar broker, colas, persistencia, acuses, retención, reintentos, mensajes fallidos y reoferta de maestros. El snapshot y la presentación no demuestran esas garantías en producción. |
| E03 | Implementación de negocio en AX y contratos de otros sistemas | X++ y procedimientos relevantes o documentación verificable del equipo responsable; transacciones, claves únicas, consulta por ID externo y respuestas parciales. Para Perú/España: contratos, ejemplos y entornos de prueba. |
| E04 | Contratos y trazas de operaciones | Una venta exitosa y otra con fallo/reintento desde caja hasta DTE, pago y ERP; ejemplos de payload, IDs, timestamps, estados y responsables. Añadir pago con NC entre sucursales, cancelación y devolución. Evitar datos personales reales. |
| E05 | Modelo de datos efectivo | DDL sin datos, índices/restricciones, schemas, colecciones/índices Mongo, migraciones aplicadas, retención y consumidores directos de SQL/reportes. Necesario para normalizar naming sin romper compatibilidad. |
| E06 | Reglas comerciales y casos de referencia | Fuente efectiva de precio/promoción, tablas de decisión, prioridades, redondeos, monedas, cantidades/unidades, grupos de cliente, vendedor, vigencias y excepciones; entradas/salidas esperadas aprobadas por negocio. |
| E07 | Datos de volumen, fallos y recuperación | Métricas de un periodo que incluya picos representativos, frecuencia/duración de cortes, latencia por etapa, reintentos, backlog e incidentes de caja/deuda. Señalar si el periodo fue atípico. Si no hay medición, distinguir estimación y proponer cómo obtenerla. |
| E08 | Dispositivos, fiscalidad y pagos | Modelos/firmware/SO/SDK de terminales, impresoras y lectores; agente Transbank; contratos de proveedores, pruebas de homologación y comportamiento ante resultado incierto. |
| E09 | Entrega, seguridad y soporte | Pipeline y artefactos de despliegue, firma/aprovisionamiento, identidad y roles, gestión de secretos sin valores, monitorización, runbooks, guardias, backups y evidencias de restauración; política de actualización de cajas atrasadas. |
| E10 | Frontera POS–plataforma corporativa | Equipo dueño de `core` y sus capacidades en producción por país; catálogo de paquetes/contratos admitidos, dependencias, versiones y política de soporte. Decidir consumidor externo, producto dentro de `core` o monorepo POS con bibliotecas compartidas; incluir autoridad y reglas de precios/ofertas por canal. |
| E11 | Garantías de las integraciones y de CI/CD | Claves idempotentes y consultas de resultado en las ACL, reconciliador efectivo y pruebas de pérdida de respuesta tras commit; SHAs de `devops-platform` consumidos, controles adicionales y evidencias de despliegue sin tráfico, gates de seguridad y rollback. Separar la entrega central de la futura administración de cajas Windows. |
| E12 | Flujo AX → MPOS → sucursales y actualización por RUT | Diagrama y DDL sin datos de MPOS, ubicación lógica sin credenciales, productor de cambios, jobs/cadencias por etapa y entidad, código/configuración WSO2 y generador/API de lotes. Explicar convivencia con el refresco individual por RUT, contactos y conflictos con cambios locales pendientes. Identificar quién reserva inventario y cómo se relaciona con la caja, que según el usuario no maneja stock. Entregar configuración y contrato de Orsan por sucursal, procedimiento ante fallos y configuraciones residuales de Instacheck: el usuario confirmó el 2026-10-02 que Orsan sigue vigente e Instacheck fue retirado. |
| E13 | Horarios y mantenimiento por flujo/base | Calendario vigente por país/sucursal, domingos/festivos/excepciones, zona IANA y TZ de procesos/SO. Identificar qué se detiene: ingreso durable, AMQP, maestros, publicación ERP, fiscalidad o recepción manual. Precisar bases intervenidas, comando/tipo de mantenimiento, drenaje, duración, restore y reapertura. Contrastar el domingo permitido por el snapshot con el procedimiento productivo informado. |
| E14 | Inventario para decidir la salida de WSO2/Andes | Producto y versiones desplegadas, CAR/Synapse/DSS/Java, contratos, SQL/WCF, productores/consumidores y dueños. Enumerar por capacidad qué debe mantenerse, migrarse o eliminarse; incluir maestros, precios y otros consumidores, no solo alta de ventas AX. Permisos cloud y plataforma de mensajería corporativa aprobada, responsables/guardias, coste y capacidad. |
| E15 | Custodia, datos y prueba del corte ERP | Retención de origen tras ACK; forma de reconstruir inbox/registro central después de restore y conciliar ERP más adelantado. Inventario de colecciones Mongo y autoridad NC, equivalencias e históricos. Política de ventas offline tardías, destino persistido, devoluciones del ERP anterior, suspensión/rollback y criterios de retiro de cada adaptador. |
| E16 | Matriz de variación por país, sociedad, sucursal y caja | Para cada combinación: app/proveedor fiscal, app de impresión, impresora y terminal (marca, modelo, firmware, conexión, SO/driver/SDK), cuenta comercial/emisor sin secretos, capacidades exigidas y responsable de soporte. Indicar qué funciona sin WAN, cómo consultar un resultado incierto y cómo sustituir un equipo con operaciones pendientes. Adjuntar sandbox, simulador o equipo de pruebas y restricciones de homologación/licencia. Ver [extensibilidad](extensibilidad-proveedores-dispositivos.md). |

Para el diagrama actual basta corregir o anotar la referencia existente si refleja producción. No se requiere que el equipo dibuje una nueva arquitectura objetivo para responder este pedido.

**Formato concreto para E01 y E04:** usar el [catálogo actual](catalogo-integraciones-actuales.md) como punto de partida y completar una fila por instancia/entorno, vinculando app, repo/SHA o artefacto, alias de host, runtime, puerto, proxy/TLS, autenticación y responsable. En cada llamada crítica, confirmar el binding desplegado, método/path, efectos, consulta de resultado, timeouts/reintentos e identidad. Las [vistas V01–V03](vistas-arquitectura-y-flujos.md) muestran las relaciones ya conocidas y los saltos pendientes. Incluir la diferencia de puerto de pagos (`3386` en imagen, `3366` predeterminado en código), HTTP de impresión frente al rótulo HTTPS/JWT, destino de `URL_API_PRECIOS`/cliente y distribución central de WSO2, lectura y procesador. No adjuntar secretos ni IPs sensibles al material de exposición.

**E17 — Priorización y fuentes para IA:** negocio y operación deben identificar tareas frecuentes, tiempos/errores actuales y coste de resolverlas manualmente. Entregar manuales vigentes con dueños, catálogo con códigos/sinónimos y evidencia de compatibilidad, pedidos anonimizados y ejemplos de incidentes. Precisar fuente autorizada de cada dato y accesos por rol/país/sociedad. No es necesario entregar conversaciones o información personal real para diseñar los pilotos.

**E18 — Viabilidad y gobierno de IA:** infraestructura, seguridad y privacidad deben confirmar cloud/proveedores/regiones permitidos, tratamiento y retención de datos, licencias, hardware disponible y presupuesto por tarea/tienda. Acordar dueño del contenido, evaluadores, revisión de cambios de modelo, calidad mínima y alternativa offline. Las [propuestas de IA](servicios-ia-pos.md) son candidatas: no implican contratar proveedores ni habilitar agentes autónomos.

**E19 — Viabilidad RFID y cadena de etiquetado:** negocio, compras y logística deben definir el proceso que quieren mejorar (conteo, recepción, caja atendida o autoservicio), su tiempo/error actual y categorías candidatas. Levantar origen del etiquetado, cobertura de proveedores, identidad/serial y unidad de empaque, materiales/embalajes, calidad del catálogo y coste de etiqueta/colocación/codificación. Incluir muestras representativas de metal, líquidos, kits y productos sin etiqueta; modelos/firmware/SDK y configuración de radio autorizada por país quedan por homologar.

**E20 — Autoridad de inventario y experiencia de caja futura:** identificar el sistema y equipo que validan conteos, movimientos y ajustes; contratos, recepción de observaciones offline y conciliación durante migración ERP. Definir gestión de excepciones, lecturas de otra cesta, devoluciones, mezcla RFID/código de barras y retiro de productos. Si se evalúa autoservicio, acordar supervisor, accesibilidad, pagos/documentos permitidos y medidas ante abandono o incidencias. Ver [RFID y autoservicio](evolucion-rfid-autoservicio.md); no atribuir stock al POS por incorporar lectores.

**Nuevo requisito confirmado:** el POS corporativo debe admitir variaciones de facturación, impresión y terminales por país/sucursal con cambios mínimos. E08 identifica los dispositivos y E16 los vincula a cada despliegue y capacidad. Para este punto basta empezar con una matriz representativa: configuraciones más usadas, excepciones y sustituciones previstas. No asumir un facturador, impresora o terminal único por país.

El [análisis de aportes corporativos](analisis-repositorios/aportes-plataforma-corporativa.md#7-información-nueva-para-pedir-al-equipo) detalla responsables y preguntas adicionales. También requiere confirmar las monedas admitidas por venta/documento en Perú: tener configuración por país no demuestra soporte multimoneda de cada flujo.

## 5. Texto breve para compartir con el equipo

> Estamos cerrando la arquitectura del POS para Chile, Perú y España, con operación offline y preparación para un ERP común. Ya revisamos la presentación de Chile y nueve repositorios (seis del POS y tres antecedentes corporativos). Necesitamos confirmar requisitos y contrastar el código con producción.
>
> Por favor, asignen un responsable por país y respondan Q01–Q10 de este documento, adjuntando la evidencia disponible de E01–E09. Prioricen alcance offline, operaciones y restricciones comerciales, capacidades fiscales/de pago, autoridades de datos y sistemas/plan ERP.
>
> Para cada respuesta indiquen: país, responsable, situación actual o requisito futuro, respuesta, evidencia y pendientes. Si un dato no existe, identifiquen quién puede obtenerlo o decidirlo. Para confirmar producción necesitamos commit o artefacto instalado; la rama probable no es suficiente.
>
> No incluyan contraseñas, tokens, claves privadas ni bases productivas. Los contratos y casos pueden usar datos sintéticos o anonimizados. No necesitamos una nueva solución diseñada por ustedes: necesitamos las reglas, restricciones y evidencias para justificarla.

Plantilla de respuesta por ID:

| Campo | Valor a completar |
| --- | --- |
| ID / país / proceso | |
| Responsable y equipo | |
| Describe situación actual o requisito futuro | |
| Respuesta y límites | |
| Evidencia, versión y fecha | |
| Pendiente, dueño y fecha estimada de resolución | |

## 6. Qué podremos cerrar con esas respuestas

Para completar la **propuesta de arquitectura** se producirán o precisarán: límites de módulos y autoridad de datos; perfil offline elegido; topología física por país/tienda; contratos y estados; decisiones de stack con alternativas/coste; modelo de seguridad; capacidad y objetivos de servicio; estrategia de datos y naming; operación; y plan de transición POS/ERP. Las decisiones se registrarán con motivación, consecuencias y pendientes aceptados.

Para demostrar la **aptitud de la implementación** se necesitan después resultados de las [pruebas de aceptación](validacion-y-decisiones.md): carga, pérdida de conectividad, cortes de energía, recuperación, duplicados, pagos inciertos, fiscalidad, conciliación, seguridad, restauración y piloto. Aprobar un diseño no equivale a haber ejecutado esas pruebas.

La propuesta puede avanzar por etapas. No hace falta esperar a que se seleccione el ERP futuro para acordar el dominio POS, IDs, contratos, reglas offline y fronteras de integración; su selección sí condicionará el mapeo definitivo, las capacidades y el corte.

**Estado técnico actualizado:** la dirección de cliente Angular + Tauri y el uso de Nx fueron indicados por el usuario. La base local revisada incluye scaffolding técnico; el [catálogo de aplicaciones y estado](opciones-tecnologicas.md#estado-de-las-aplicaciones) precisa su alcance. NestJS/Fastify, `nestjs-pino` y Sentry requieren completar integración, homologación y operación; su presencia en la base técnica no demuestra el producto funcionando. Para Q08–Q10, añadir hardware/SO mínimo de cajas, WebView2, drivers/SDK, administración de flota, permisos de instalación, experiencia NestJS/Rust y restricciones de telemetría.

Nx organiza el monorepo; el **monolito modular de sucursal** sigue siendo la recomendación de despliegue. Falta completar responsables y propiedad de módulos, permisos sobre código, toolchains, CI Windows, versiones de contratos y necesidades justificadas de despliegue independiente. El repositorio compartido no obliga a actualizar todas las cajas y servicios simultáneamente.

## Actualización: evidencia pendiente del concentrador

Ya se recibió y auditó `mountain-concentrador`; no es necesario volver a pedir su implementación. Se requiere confirmar artefactos **desplegados** (CAR/JAR, Node y .NET), export sanitizado de APIs/tasks/stores, elección del consumidor Node o SamplingProcessor, bindings de colas, DDL/funciones, productor AX→MPOS y recuperación integrada. La rama predeterminada es Pablo, con snapshot de 2023; se necesita acreditar su relación con los clientes de 2026. [Preguntas y pruebas concretas](analisis-repositorios/mountain-concentrador.md#6-evidencia-concreta-que-falta-pedir).
