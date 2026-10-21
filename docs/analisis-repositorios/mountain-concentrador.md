# mountain-concentrador: integración central reconstruida

Revisión estática: **2 de octubre de 2026**. Se cruzó este repositorio con los consumidores y adaptadores ya revisados. No se ejecutó código corporativo ni se consultaron servicios, bases o dispositivos. Los diagramas representan código y contratos compatibles; no certifican el despliegue productivo.

## 1. Qué aporta a la arquitectura

Este repositorio contiene gran parte del tramo que antes aparecía como «bus central»: APIs y secuencias WSO2/Synapse, servicios de datos DSS, mediadores Java, una API Node de lectura de maestros y un consumidor Node del broker. **No es la aplicación `backend-concentrador` de `mountain-implementos`**: esa aplicación administra mensajes y solicita reintentos. El broker tampoco equivale a todos estos procesos.

El [mapa de repositorios de software](../mapa-repositorios-y-conexiones.md) muestra cada nombre, sus unidades y sus conexiones. En la presentación, el mapa permite seleccionar repositorios y relaciones; los recorridos de sincronización y maestros descomponen después los componentes, endpoints y tablas.

### Qué significa concentrador

Un **concentrador** reúne componentes centrales que reciben mensajes de las sucursales, coordinan su procesamiento hacia el ERP y distribuyen cambios de datos maestros a las cajas. Puede incluir APIs, procesos, mensajería y persistencia; el término no implica un único servidor.

| Nombre | Qué identifica en este proyecto |
| --- | --- |
| Concentrador | La función central de reunir, procesar y distribuir información. |
| `mountain-concentrador` | El repositorio con componentes de integración: WSO2/Synapse, DSS, mediadores Java, API de lectura y consumidor Node. |
| PostgreSQL del concentrador | El almacenamiento central de mensajes, lotes y estados de procesamiento. |
| `mountain-implementos/backend-concentrador` | La aplicación que permite consultar estados y solicitar reintentos. |

Por ejemplo, el sincronizador de una sucursal envía una venta a la integración central. **Recibir el mensaje no confirma que AX haya registrado la venta**: el resultado del ERP corresponde a una etapa posterior. Las conexiones concretas y los límites del código revisado se detallan en las secciones siguientes. El concepto también está disponible en el glosario de POS Platform, accesible con la tecla **G**.

## 2. Versión y límites de evidencia

| Referencia | Evidencia |
| --- | --- |
| Rama predeterminada | `Pablo`; no se encontró `main` entre las referencias recibidas. |
| Snapshot principal | `b2fd1ec266d131abb54b7076d41acce30f045119`, 2023-09-08. |
| `master` | `03ab8598b92b4f2dcad8c79861cc2e0036901b35`, 2023-08-14. |
| Divergencia `master…Pablo` | 2 commits exclusivos de master y 17 exclusivos de Pablo. No se fusionaron para reconstruir un sistema supuesto. |
| Artefactos | Hay CAR/JAR y variantes PROD/QA/DESA. Su nombre no demuestra instalación ni correspondencia con la fuente. |
| Comparación entre repositorios | El concentrador tiene un snapshot de 2023; varios clientes revisados son de 2026. Coincidir en contrato no demuestra que estas versiones convivan en producción. |

[Snapshot del concentrador](https://github.com/developer-implementos/mountain-concentrador/tree/b2fd1ec266d131abb54b7076d41acce30f045119). La inspección de archivos comprimidos fue estática. No se copiaron secretos, direcciones privadas ni payloads de clientes a estos entregables.

## 3. Componentes y relaciones

| Unidad | Responsabilidad comprobada | Conexión principal |
| --- | --- | --- |
| `ESBImplementos` | APIs HTTP, secuencias, stores JMS, tasks y message processors | `mountain-sync-sucursal` → ingreso → persistencia/mediación → .NET/AX. |
| `DSConcentrador` / `DSDatasource` | Servicios DSS y definiciones de acceso a datos | Registro central PostgreSQL y consultas de tablas de intercambio. Datasource efectivo pendiente. |
| `ClassRegistraMensajeDetalle` | Interpretar sobres, persistir detalles/destinos, leer MPOS, generar lotes y registrar resultados | SQL Server MPOS ↔ Java ↔ PostgreSQL central. |
| `ClassProcesaCola` | Reclamar y finalizar filas de `public.cola_mensajes` | Cola persistida → secuencia de procesamiento. |
| `procesador-cola-bus` | Consumir XML AMQP y crear `cola_mensajes`; limpiar procesados mediante cron | Broker → Node → PostgreSQL. El registro en AX lo continúa Java/Synapse. |
| `api-lectura` | Ofrecer lotes, recibir acuses y recuperar enviados no procesados | `mountain-sync-sucursal` ↔ HTTP `mensajeSalidas/*` ↔ PostgreSQL. |
| Proyectos CApp / `CAR` | Empaquetar variantes de configuración | Fuente de comparación de artefactos; no aplicaciones adicionales por cada carpeta. |

Además, `mountain-implementos/backend-concentrador` solicita reintentos y consulta estados; `apis-implementos/ApiCarro` lee tablas centrales para recuperar URL del DTE. Impresión y pagos conservan sus caminos propios. `core`, `devops-platform` e `integration-presentations` aparecen como antecedentes corporativos, sin inventar tráfico actual del POS hacia ellos.

Las rutas, rangos de código y variantes están desarrollados en [ingreso, procesamiento y respuesta AX](mountain-concentrador-ingreso.md), [MPOS, lotes y API de lectura](mountain-concentrador-maestros.md) y [conexiones entre repositorios](../mapa-repositorios-y-conexiones.md).

## 4. Hallazgos que modifican o precisan el análisis anterior

1. **La recepción HTTP no confirma AX.** `mensajeEntradas/ingresar` registra el sobre, publica al store y devuelve un indicador `procesado` fijado en esa fase. El resultado de AX se procesa y devuelve después. La emisión fiscal es otro recorrido.
2. **Hay dos configuraciones de consumo versionadas.** Node → PostgreSQL → Java y un `SamplingProcessor` Synapse asociado al store. No se acreditó cuál está activo ni que sean pasos consecutivos. El diagrama conserva esa alternativa.
3. **El ACK central puede preceder a la persistencia.** El callback Node invoca la creación de fila sin esperar la promesa y luego confirma AMQP. Es una ventana de fallo demostrable por lectura; no prueba un incidente ocurrido. Hay un patrón análogo en el consumidor de sucursal.
4. **Los lectores de MPOS están localizados.** Java selecciona SQL Server `MPOS`, lee `CustTableSync` e invoca `MPOS.dbo.sp_caja_custTable`. Sigue faltando el productor AX→MPOS, el cuerpo del procedimiento, DDL, horario efectivo y ubicación física. La cadencia diaria de los apuntes no queda confirmada.
5. **Existe recuperación central de lotes.** `sin-procesar` selecciona `enviado=true` y `procesado=false` incluso si `recibido_sucursal=true`. El acuse temprano del sync no permite concluir pérdida definitiva por sí solo. Sigue siendo necesario probar relectura, retención, orden y reejecución de detalles.
6. **Las fronteras de persistencia son múltiples.** SQL Server, detalles/cabeceras/lotes PostgreSQL, efecto AX y publicación de respuesta no comparten una transacción global demostrada. Algunos métodos bulk confirman parcialmente. Contadores incrementales no equivalen a éxito contable ni a deduplicación.
7. **Consultar una respuesta vacía no prueba que AX no actuó.** Un timeout tras el efecto ERP exige consulta o conciliación con identidad estable; reenviar a ciegas no es una garantía de recuperación.

Cada hallazgo tiene las fuentes y sus límites en los dos informes especializados anteriores. Los valores `count`/`interval` de tasks y las diferencias CAR/fuente se conservan como configuración observada: no se traducen a una cadencia productiva sin verificar el runtime.

## 5. Consecuencias para la propuesta enterprise

La decisión de sustituir WSO2 debe evaluarse **por capacidad**. RabbitMQ puede cubrir transporte y BullMQ ciertos trabajos; ninguno reemplaza por sí solo las APIs, consultas DSS, transformaciones Java, lectura MPOS, distribución de lotes, estados, reintentos y adaptación AX que ahora identificamos. Primero se requiere inventario del despliegue, pruebas de contrato y estrategia de migración por recorrido.

| Capacidad heredada | Contrato propuesto y criterio de salida |
| --- | --- |
| Recepción de operaciones | Inbox durable e identidad de operación; devolver acuse de custodia separado del resultado ERP. |
| Transformación y registro AX | Puerto corporativo + ACL AX. El nuevo ERP implementa otro adaptador; referencias y pendientes conservan su destino original. |
| Consumo y reclamación de trabajo | Persistir antes del ACK, claim concurrente y recuperable, reintentos acotados, error visible y conciliación de resultado incierto. |
| Maestros MPOS y lotes | Publicador de versiones/cambios con bajas, checkpoints y recuperación; transición compatible hasta validar todos los consumidores. |
| Reintentos y administración | Operaciones autorizadas/auditables por identidad; inspección de estado y política, sin depender de editar tablas internas. |
| Lectura interna desde ApiCarro | Contrato de consulta de resultado/URL; retirar acoplamiento SQL solo después de migrar ese consumidor. |

No se necesita decidir ahora un broker nuevo para estabilizar estos contratos. Tampoco se justifica retirar MPOS o PostgreSQL central solo por reducir el número de bases: primero deben migrarse sus responsabilidades, datos y consumidores.

## 6. Evidencia concreta que falta pedir

- Export sanitizado de APIs, secuencias, tasks, processors y stores activos; versiones y hashes de CAR/JAR y aplicaciones Node/.NET, por ambiente.
- Confirmación de la rama/commit desplegado, especialmente por la antigüedad del snapshot central y las variantes de consumo.
- Topología de colas y bindings; política de persistencia/retención, confirmaciones y recuperación de filas `en_proceso`.
- Productor AX→MPOS, DDL, índices/constraints, funciones centrales y cuerpos de procedimientos usados; sin datos productivos ni credenciales.
- Traza anonimizada con IDs de venta, mensaje local, registro central y resultado AX; incluir éxito, timeout después del efecto y relectura de un lote.
- Pruebas de interrupción entre commits/ACK y publicación, duplicados concurrentes, acuses repetidos, lotes parcialmente aplicados y reinicio del procesador.

Estas respuestas permiten cerrar el mapa físico y validar garantías. La evidencia recibida permite ya mejorar el mapa lógico y diseñar la transición con responsabilidades concretas.
