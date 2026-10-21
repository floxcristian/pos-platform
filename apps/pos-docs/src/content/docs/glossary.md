---
title: Glosario del POS
description: Significado de los términos de la propuesta POS Platform y enlaces a su diseño concreto.
editUrl: false
---

Estas definiciones precisan el uso de los términos **en esta propuesta**. Los enlaces llevan al contrato, comportamiento o decisión correspondiente.

## Conceptos de producto y arquitectura

| Término | Significado en POS Platform | Detalle |
| --- | --- | --- |
| Módulos de negocio compartidos | Casos de uso y reglas reutilizables de venta, caja, precios y otras capacidades; conservan límites de responsabilidad y datos. | [Producto](/guide/proposal/product/) |
| Backend de sucursal | Servicio local que recibe operaciones de las cajas por LAN y confirma transacciones en PostgreSQL de la tienda. Es lo que material anterior llamaba «núcleo local». | [Aplicaciones y datos](/guide/proposal/architecture/) |
| Plataforma de país | Aplicaciones y datos que reciben operaciones, distribuyen maestros e integran los sistemas de una jurisdicción y entidad legal. | [Arquitectura](/guide/proposal/architecture/) |
| Perfil de país | Configuración aprobada que selecciona capacidades, reglas y adaptadores compatibles. No sustituye el código de un proveedor nuevo. | [Producto y variantes](/guide/proposal/product/#objetivo-de-producto-y-criterios-de-evolución) |
| Perfil de usuario | Agrupación de accesos de una persona. Mountain ya tiene perfiles y accesos a módulos; la autorización detallada propuesta necesita acordarse. | [Acceso y permisos](/guide/proposal/access-operations/) |
| Capacidad efectiva | Operación permitida por configuración, identidad, conectividad, vigencia de datos y disponibilidad real de sus dependencias. | [Proveedores](/guide/architecture/providers/#4-configuración-tipada-y-capacidades-efectivas) |
| Perfil WAN | Continuidad ante pérdida de Internet mientras LAN, backend y base de sucursal siguen disponibles. | [Continuidad](/guide/proposal/continuity/) |
| Autoridad de un dato | Sistema responsable de aceptar y conservar sus cambios válidos; una copia de consulta no adquiere esa autoridad. | [Propiedad de datos](/guide/proposal/synchronization/#propiedad-de-datos-y-conflictos) |
| Commit | Confirmación de una transacción en la base responsable. El commit de venta local no equivale a contabilización ERP ni liquidación del pago. | [Confirmación de venta](/guide/proposal/continuity/#confirmación-local-de-una-venta) |
| Outbox | Registro de eventos pendientes, persistido en la misma transacción que el cambio de negocio. | [Sincronización](/guide/proposal/synchronization/) |
| Inbox | Registro durable de mensajes recibidos que permite detectar duplicados y recuperar su procesamiento. | [Sincronización](/guide/proposal/synchronization/) |
| ACK o acuse | Confirmación cuyo alcance debe nombrarse: recibir transporte, persistir en central y aplicar en ERP son hechos distintos. | [Entrega durable](/guide/proposal/synchronization/) |
| Idempotencia | Repetir la misma operación identificada no debe crear otro efecto de negocio. Requiere contratos y persistencia; no la garantiza por sí solo un broker. | [Sincronización](/guide/proposal/synchronization/) |
| Snapshot y delta | Paquete completo y cambio incremental de una versión de datos. Deben validarse antes de activar la nueva versión. | [Precios](/guide/proposal/pricing-promotions/) |
| Fachada | Entrada estable que coordina un caso de uso o simplifica el acceso a una capacidad sin exponer todas sus dependencias. | [Contratos y fronteras](/guide/proposal/contracts/#acl-fachada-y-adaptador) |
| ACL | Capa anticorrupción que traduce significado entre el modelo del POS y un sistema externo. En este contexto no significa una lista de permisos. | [ACL](/guide/proposal/contracts/#acl-fachada-y-adaptador) |
| Adaptador | Implementación de un contrato para un ERP, proveedor o dispositivo concreto. | [Proveedores](/guide/architecture/providers/) |
| Conciliación | Comparación de evidencias para resolver diferencias o resultados inciertos entre POS, pagos, fiscalidad y ERP. | [Integración](/guide/proposal/integration/#contrato-común-y-conciliación) |
| Contenedor C4 | Aplicación o almacén de datos en el modelo arquitectónico; no implica que se despliegue con Docker. | [Modelo C4](/guide/architecture/c4-model/) |
| Monorepo | Organización del código de varios proyectos relacionados. Sus aplicaciones pueden ejecutarse y desplegarse de manera independiente. | [Estructura y límites](/guide/architecture/monorepo/) |
| BullMQ / RabbitMQ | Alternativas de coordinación de trabajos y distribución de mensajes que requieren un caso de uso y operación justificados. | [Evaluación de mensajería](/guide/architecture/messaging/) |
| Homologación | Evidencia de compatibilidad de una combinación de país, reglas, versiones, proveedor y dispositivo para las operaciones admitidas. | [Validación](/guide/operations/validation/) |

## Red, aplicaciones y código

| Término | Significado en POS Platform | Detalle |
| --- | --- | --- |
| <span id="erp"></span>ERP | Sistema de gestión empresarial que recibe las operaciones según el contrato financiero. El sistema vigente depende del país y de la fase de migración. | [Integración por país](/guide/proposal/integration/) |
| <span id="wan-lan"></span>WAN / LAN | WAN es la conexión de la sucursal con redes externas; LAN es la red local entre cajas y servidor. La propuesta inicial mantiene LAN y servidor disponibles durante una caída de WAN. | [Continuidad](/guide/proposal/continuity/) |
| <span id="api-endpoint"></span>API / endpoint | API es el contrato de acceso de una aplicación. Un endpoint HTTP combina método y ruta, por ejemplo `POST /punto-de-venta` en Mountain. El nombre por sí solo no prueba qué efectos implementa. | [Catálogo legacy](/guide/api/mountain/) |
| <span id="runtime"></span>Runtime | Entorno de ejecución. En este monorepo, `pos-runtime` es además el nombre de la aplicación que implementará el backend de sucursal; es distinto del navegador y de sus bibliotecas. | [Aplicaciones](/guide/architecture/monorepo/#estado-de-las-aplicaciones) |
| <span id="worker"></span>Worker | Proceso que realiza trabajo en segundo plano, como entregar eventos o integrar una operación con ERP. Requiere persistir sus pendientes y recuperarse después de un reinicio. | [Sincronización](/guide/proposal/synchronization/) |
| <span id="broker"></span>Broker | Servicio que transporta mensajes entre productores y consumidores. RabbitMQ puede cumplir ese papel cuando se justifique; no reemplaza la transacción de negocio ni la conciliación. | [Mensajería](/guide/architecture/messaging/) |
| <span id="contexto"></span>Contexto de negocio | Área con vocabulario, reglas y datos propios, como ventas o caja. Las bibliotecas agrupan su código; no implican automáticamente microservicios. | [Límites de módulos](/guide/architecture/monorepo/) |
| <span id="contrato"></span>Contrato | Acuerdo explícito sobre entrada, salida, errores, identidad y significado de una operación. Incluye reglas, no solo la forma de un JSON. | [Fachada y ACL](/guide/proposal/contracts/) |
| <span id="scaffolding"></span>Scaffolding | Base de carpetas, proyectos y configuración para construir el producto. Un módulo vacío o un arranque exitoso no implementa una venta ni prueba recuperación. | [Estado del monorepo](/guide/architecture/monorepo/#estado-de-las-aplicaciones) |
| <span id="variables-entorno"></span>Variable de entorno | Parámetro que una aplicación lee al arrancar o ejecutar una función. Su propósito y condiciones se documentan; los valores y secretos de cada entorno se administran por separado. | [Configuración legacy](/guide/api/mountain-configuration/) |

## Persistencia e identidades

| Término | Significado en POS Platform | Detalle |
| --- | --- | --- |
| <span id="transaccion"></span>Transacción de base de datos | Agrupa cambios que se confirman o revierten juntos en una base. Guardar venta y outbox en la misma transacción no incluye automáticamente el cobro de un proveedor remoto. | [Confirmación local](/guide/proposal/continuity/#confirmación-local-de-una-venta) |
| <span id="postgresql-jsonb"></span>PostgreSQL / JSONB | Base relacional recomendada para sucursal y país. JSONB permite conservar datos JSON dentro de ella cuando convenga, junto con las reglas de validación e índices necesarios. | [Evaluación tecnológica](/guide/architecture/technologies/) |
| <span id="proyeccion"></span>Proyección | Vista o copia derivada para consultar información. Por ejemplo, ventas consolidadas en país; su existencia no cambia quién es responsable de la venta original. | [Propiedad de datos](/guide/proposal/synchronization/#propiedad-de-datos-y-conflictos) |
| <span id="schema"></span>Schema | Puede significar una estructura de validación de datos o un espacio de nombres de PostgreSQL. El documento debe indicar cuál: un schema de contrato no es una nueva base. | [Convenciones](/guide/proposal/contracts/#convenciones-y-vocabulario) |
| <span id="journal"></span>Journal de dispositivo | Registro persistido de comandos e intentos de pago o impresión para recuperar su estado. No es otro libro de ventas y no acredita por sí solo un efecto físico. | [Dispositivos](/guide/architecture/providers/) |
| <span id="identidades"></span>ID de venta, comando, evento e intento | Identifican hechos distintos: la venta de negocio, una solicitud, un cambio ocurrido y una interacción con el proveedor. Un reenvío conserva la identidad de la operación que repite; no inventa otra venta. | [Ejemplo de venta](/guide/proposal/continuity/) |
| <span id="commit-codigo"></span>Commit de Git | Versión de los archivos de un repositorio. Los informes legacy enlazan un commit para fijar la evidencia. Es distinto del commit de una transacción PostgreSQL. | [Alcance de revisión](/guide/evidence/audit/) |

## Sincronización y recuperación

| Término | Significado en POS Platform | Detalle |
| --- | --- | --- |
| <span id="watermark"></span>Watermark / marca de corte | Posición hasta la que un snapshot contiene los cambios de una fuente. Permite saber desde dónde aplicar deltas sin omitirlos ni mezclarlos. | [Publicación de precios](/guide/proposal/pricing-promotions/#publicación-y-activación-de-versiones-comerciales) |
| <span id="staging"></span>Staging / versión candidata | Área aislada donde se prepara y valida una nueva versión comercial. Las ventas siguen leyendo la versión activa hasta que la candidata completa puede activarse. | [Activación de precios](/guide/proposal/pricing-promotions/#publicación-y-activación-de-versiones-comerciales) |
| <span id="cursores"></span>Cursor recibido / aplicado | Posiciones persistidas de avance. Haber almacenado un paquete no significa que su versión ya esté validada y activa para vender. | [Precios y ofertas](/guide/proposal/pricing-promotions/) |
| <span id="ttl"></span>TTL / plazo de vigencia | Tiempo durante el que un dato o autorización puede usarse conforme a su política. La vigencia de una cotización necesita acuerdo comercial; conservar una versión no prolonga ese plazo. | [Vigencia de cotización](/guide/proposal/pricing-promotions/#vigencia-de-la-cotización-y-comienzo-del-pago) |
| <span id="lease-fencing"></span>Lease / fencing | Un lease otorga temporalmente el trabajo a un proceso. Fencing permite rechazar escrituras de un dueño anterior aunque vuelva a ejecutarse. La validez se comprueba al escribir; el vencimiento del lease no detiene por sí solo al proceso anterior. | [Resiliencia](/guide/operations/resilience/) |
| <span id="binding"></span>Binding de proveedor | Asociación persistida de una operación con proveedor, cuenta, dispositivo y versión de contrato. Un pago incierto debe consultarse en su destino original aunque cambie la configuración. | [Proveedores](/guide/architecture/providers/) |
| <span id="backlog"></span>Backlog | Trabajo pendiente acumulado. Su recuperación debe convivir con ventas nuevas y respetar límites del ERP o proveedor. | [Mensajería](/guide/architecture/messaging/) |
| <span id="replay-dlq"></span>Replay / DLQ | Replay es reprocesar mensajes conservados. DLQ es una cola o registro de fallos apartado para diagnóstico. Reprocesar requiere conservar identidad, revisar la causa y evitar repetir efectos financieros. | [Recuperación](/guide/operations/resilience/) |
| <span id="rpo-rto"></span>RPO / RTO | RPO delimita la pérdida de datos tolerable; RTO, el tiempo de recuperación exigido. Deben acordarse por escenario y probarse con backups, restauración y dependencias reales. | [Criterios del piloto](/guide/operations/validation/) |
| <span id="slo-sla"></span>SLI / SLO / SLA | SLI es una medición; SLO, su objetivo operativo; SLA, un compromiso de servicio acordado. Los números ilustrativos de una propuesta no son compromisos aprobados. | [Validación y objetivos](/guide/operations/validation/) |

## Cómo leer el estado de una afirmación

**Propuesto** describe el comportamiento objetivo. **Observado en código** describe el snapshot identificado. **Scaffolding local** describe la base de desarrollo revisada. **Validado en producción** requiere evidencia del sistema desplegado; ninguna de las tres etiquetas anteriores lo demuestra por sí sola.

Los [informes de evidencia](/guide/evidence/audit/) conservan su procedencia. El [registro de decisiones](/guide/proposal/decisions/) conserva el estado del diseño recomendado.
