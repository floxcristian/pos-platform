# Validación y decisiones pendientes de la arquitectura POS

Este documento convierte la [propuesta de arquitectura](propuesta-arquitectura.md) en criterios verificables. Los objetivos son iniciales y están sujetos a la escala, los equipos y las reglas comerciales aún no confirmadas. Las pruebas descritas son trabajo futuro: no se han ejecutado sobre una implementación.

El [análisis de repositorios del 1 de octubre de 2026](analisis-repositorios/README.md) agrega casos concretos de regresión y recuperación. La inspección estática acredita los caminos indicados por commit; no cuenta como ejecución satisfactoria de las pruebas siguientes.

La propuesta distingue autonomía por sucursal ante pérdida de WAN y autonomía por caja ante pérdida adicional de LAN o servidor local. Los objetivos de persistencia se miden en el nodo escritor del perfil elegido. Las pruebas de aislamiento de terminal solo son obligatorias para el segundo perfil; en el primero se comprueba el bloqueo explícito y la recuperación del servicio de sucursal.

La [revisión corporativa por rondas](revision-arquitectura-corporativa.md) toma el perfil WAN como vista preferente y agrega decisiones de mensajería, horarios, datos y migración. La [matriz ampliada de resiliencia](revision-resiliencia-datos-pos.md) contiene 28 casos límite; los [gates de mensajería](investigacion-mensajeria-pos.md#5-matriz-de-decisión-provisional-por-carga-de-trabajo) deben superarse antes de adoptar RabbitMQ, BullMQ, Pub/Sub o workers PostgreSQL. Son pruebas pendientes.

**Estado de los objetivos:** sus valores están pendientes de acuerdo y medición. Las cifras exploratorias del borrador no se usan como valores predeterminados. El horizonte debe derivarse de pausas programadas, desconexión, reparación, vigencias y capacidad por destino. El inventario público de tiendas no determina carga ni cantidad de cajas.

## Objetivos medibles propuestos

| Objetivo | Definición pendiente y responsable sugerido | Condiciones y medición |
| --- | --- | --- |
| Autonomía técnica | Horizonte y operaciones admitidas: producto, operaciones y responsables fiscales/pagos | Captura local con carga representativa. La venta real queda limitada por permisos, fiscalidad, pagos y vigencia de maestros; inventario solo si se incorpora al alcance |
| Confirmación de persistencia local | Umbrales p95/p99 y carga: ingeniería POS y operaciones | Medir desde solicitud de commit hasta respuesta durable en el hardware homologado; excluye interacción humana, impresión y autorización externa |
| Disponibilidad de API del país | Porcentaje, ventana y exclusiones: plataforma y negocio | Solicitudes válidas dentro de carga acordada, con tratamiento explícito del mantenimiento; medir caja, pagos y fiscalidad por separado |
| Frescura de recepción central | Percentiles y demora máxima: integración y operaciones | Desde commit local hasta acuse central, con conectividad estable y carga de diseño; medir desconexiones y ventanas cerradas por separado |
| Recuperación de backlog | Plazo de vaciado y capacidad segura por destino: integración y dueños de ERP/proveedores | Medir reconexión con tráfico nuevo; el consumo útil debe superar la llegada sin saturar destinos ni impedir ventas nuevas |
| Reinicio de aplicación de caja en perfil ampliado | RTO por escenario, solo si ese perfil se aprueba: plataforma y operaciones | Equipo, almacenamiento y material fiscal íntegros; recuperar transacciones e intentos inciertos |
| Reinicio y sustitución del servidor de sucursal en perfil WAN | RTO y RPO por escenario: plataforma, DBA y operaciones | El servidor es el escritor de todas sus cajas; medir reinicio con disco sano y pérdida completa como incidentes distintos |
| Recuperación de plataforma de país | RTO y RPO ante desastre: plataforma, DBA e integración | Requiere réplica, backups, archivo de reconstrucción y ensayo. No se extrapola a la tienda aislada |

RTO es el tiempo objetivo para recuperar una capacidad; RPO, la pérdida máxima de datos objetivo en un escenario definido. p95 y p99 son los tiempos bajo los que debe caer el 95 % y el 99 % de las mediciones del conjunto acordado. Antes de ejecutar el piloto, cada objetivo debe registrar valor aprobado, escenario, carga, versión, hardware, responsable y criterio de aceptación. Sin esa ficha, una medición sirve para explorar capacidad, no para declarar cumplido un compromiso de servicio.

Para reinicios con almacenamiento sano, se busca no perder ventas cuyo commit local fue confirmado. En el perfil ampliado por terminal, si la caja se destruye cuando contiene la única copia, la pérdida puede abarcar toda la desconexión desde la última réplica. Una segunda copia en la tienda no protege frente a la destrucción completa del local durante una caída WAN.

En el perfil ampliado se propone replicación asíncrona al nodo de tienda y visibilidad del tramo aún sin replicar. Exigir una segunda copia síncrona antes de confirmar reduce el riesgo de pérdida del equipo, pero obliga a detener esa modalidad si el nodo deja de responder. Negocio debe elegir esa garantía o mantener las ventas habilitadas en modo degradado.

En el perfil WAN, PostgreSQL de sucursal es el escritor: su mismo disco o un backup en el mismo servidor no cuentan como una segunda copia independiente. Se debe definir réplica en otro equipo o restauración desde backup independiente, energía protegida y capacidad de repuesto. El RPO ante pérdida del servidor depende del retraso de esa réplica o backup; durante la recuperación las cajas no venden. Un failover debe aislar al escritor anterior antes de habilitar otro. La pérdida completa de la tienda durante caída WAN conserva el mismo riesgo del tramo aún no enviado fuera del local. Los objetivos de recuperación de la plataforma de país no se aplican automáticamente a este servidor.

Para recuperar un desastre central, conservar eventos de origen ya acusados durante una ventana de replay superior al horizonte de recuperación, y mantener archivo durable independiente. No purgar la única copia recuperable. La ventana, las claves de deduplicación y el punto de recuperación deben permitir reconstruir la plataforma sin duplicar documentos externos. El replay se prueba contra ERPs y proveedores que pueden haber avanzado más que el backup central.

## Escenarios de aceptación

La [extensibilidad de proveedores y dispositivos](extensibilidad-proveedores-dispositivos.md) añade una matriz de compatibilidad por país/sociedad/sucursal/caja. Las pruebas se ejecutarán contra simuladores para fallos reproducibles y hardware/proveedores homologados para validar el efecto real; una simulación de presentación no acredita ese soporte.

| Prueba | Evidencia de aceptación |
| --- | --- |
| Cambiar impresora por otra combinación homologada | Nuevo perfil activado sin cambiar el núcleo; formato y caracteres verificados; reimpresión conserva documento fiscal y pago originales |
| Incorporar otro SDK o protocolo de terminal/facturador | Adaptador cumple contratos y pruebas de estados, permisos, importes y recuperación; no aparecen detalles del proveedor en el dominio de ventas |
| Timeout y sustitución de proveedor/dispositivo | El intento incierto conserva su destino y referencia; no se genera otro cargo o documento con el perfil nuevo; existe conciliación o resolución operativa trazable |
| Reversa o consulta histórica después de sustituir el equipo/proveedor | Resolver origen y referencia del efecto anterior, sin aplicar el perfil nuevo; probar retirada física del dispositivo con pendientes y resolución controlada si falta consulta homologada |
| Resultado del agente persistido en sucursal y acuse perdido | Reentrega del mismo resultado sin repetir el efecto; agente retiene evidencia hasta acuse durable y durante la ventana de recuperación acordada |
| Capacidades diferentes y desconexión | Se distinguen soportada, habilitada y disponible; operación no permitida queda restringida con motivo explícito sin impedir otras capacidades independientes autorizadas |
| Actualización incompleta o incompatible de perfil/adaptador | Se conserva una combinación anterior válida o se restringe la capacidad afectada; pendientes siguen siendo legibles y recuperables; no se necesita descargar configuración para cada venta |
| WAN interrumpida durante el horizonte acordado | Ventas habilitadas persisten; permisos y límites se cumplen; ninguna venta depende del ERP; cola y estado visibles |
| LAN o nodo de tienda caído | **Perfil WAN preferente:** no iniciar nuevas ventas sin acceso al escritor de sucursal; las ventas y el turno ya confirmados se recuperan desde su persistencia disponible. **Perfil ampliado por terminal, solo si se aprueba:** continuar únicamente capacidades locales admitidas, sin segundo escritor para la misma operación. Ver [perfil canónico](propuesta-arquitectura.md#funcionamiento-sin-conexión). |
| Corte de energía en cada fase de venta | Transacción completa o ausente, nunca parcial; pago aprobado e intención persistida recuperables; impresiones repetibles sin nuevo cobro |
| Disco lleno o escritura fallida | Detección antes del pago cuando sea posible; recuperación explícita si el pago ya ocurrió; no mostrar confirmación sin commit |
| Respuesta del pago perdida tras autorización | Estado desconocido, consulta por referencia y resolución; no se genera automáticamente otro cargo |
| Aprobación de pago y fallo fiscal | Estado operativo visible, documento o compensación conforme al régimen; no se oculta como venta plenamente finalizada |
| Impresora caída tras emisión | Se reimprime el mismo documento; no se asigna otro folio ni se repite el pago |
| Evento repetido y acuse central perdido | Un efecto por ID; el reenvío obtiene el resultado persistido |
| Evento repetido con payload diferente | Rechazo y alerta; no sobrescribe la transacción original |
| Eventos fuera de orden o con huecos | Se detectan y recuperan dependencias; no se inventa un orden usando solo timestamps |
| ERP cae durante varios días | Backlog durable, alertas por antigüedad y conciliación; países y destinos restantes continúan |
| ERP registra y pierde la respuesta | Consulta por referencia externa sin duplicación; si no existe esa capacidad, la prueba identifica una limitación bloqueante |
| Cierre de ventana con trabajos en curso y entradas AMQP/manuales | Política común de admisión, drenaje con límite y checkpoints. Sin ACK previo a persistencia; pendiente por horario distinto de error técnico |
| Domingo, festivo o cambio de offset horario | Calendario por sucursal y zona IANA, decisión de política explícita y timestamps UTC; no heredar por accidente la condición «otros días» del legado |
| Reconexión simultánea y reapertura de AX | Límites por destino, distribución temporal, avance justo y orden por agregado; no agotar conexiones/disco ni dejar trabajo antiguo sin progreso |
| Restore central anterior a un ACK ya recibido por tienda | Reconstruir desde origen/archivo conservado, detectar huecos y deduplicar contra efectos externos ya aplicados. Verificar el RPO acordado antes de permitir purga |
| Mismo job vuelve a ejecutarse tras perder un lock o reiniciar el worker | Estado e identidad de negocio evitan repetir el efecto local; consulta/conciliación cuando el efecto externo es incierto |
| Migración de reservas de NC a otro motor | Misma autoridad, exclusión y propietario; reserva/consumo/liberación atómicos, saldos/históricos conciliados. Una proyección de lectura no autoriza gasto |
| Corte ERP con pendientes de tiendas desconectadas | Destino/fase persistidos, tratamiento explícito de tardíos e históricos, sin doble contabilización; rollback conciliado |
| Maestros descargados parcialmente | Se mantiene la versión anterior íntegra; la nueva se activa de forma atómica |
| Precio cambia mientras una caja está aislada | Se respeta la vigencia autorizada; la venta conserva sus valores y reglas originales |
| Falla el refresco remoto del cliente al seleccionarlo/cargarlo | Se distingue ficha local vigente, datos vencidos y cliente no conocido; la política autorizada conserva la venta en curso. Probar los recorridos de interfaz y no asumir fallback por la existencia de una copia local; MI-09 |
| Lote atrasado después de refresco individual por RUT o de edición local pendiente | Versión y propiedad por atributo evitan sobrescrituras indebidas; direcciones/contactos y cambios pendientes conservan trazabilidad |
| Oferta local con reglas solapadas o vencidas | Resultados deterministas, prioridades y redondeo aprobados; versión registrada y ausencia de consultas centrales obligatorias |
| Carga comercial parcial, delta con hueco o activación concurrente | La versión activa permanece íntegra; recepción y aplicación tienen cursores distintos. Solo una candidata completa y validada cambia el puntero mediante commit corto; no se publica por completar únicamente la descarga |
| Promoción vence entre cotización e inicio del pago | La política comercial/fiscal acordada decide la vigencia y la recotización antes de cobrar; fijar versión no prolonga el plazo. Importe revisado visible, sin sustitución silenciosa |
| Nueva versión de precios llega con un pago en curso o incierto | El intento conserva importe, identidad y referencia mientras se resuelve. No se recalcula el cargo iniciado ni se crea otro cobro para aplicar la nueva versión |
| Cupón o presupuesto de oferta compartido offline | Respeto de cupos exclusivos o bloqueo; no se promete impedir doble uso sin coordinación |
| Dos cajas venden la última unidad aisladas, solo si se asigna al POS control de disponibilidad | Se cumplen cupos exclusivos o política explícita de sobreventa; no se presenta stock global como garantizado. La caja actual no maneja stock según el usuario |
| Dos cajas intentan devolver el mismo ticket offline | Se bloquea o se consume una autorización exclusiva; la copia del ticket no concede saldo duplicable |
| Revocación de usuario durante desconexión | Se respeta la ventana residual aprobada; al vencer, las operaciones protegidas quedan bloqueadas |
| Reloj atrasado, reinicio o restauración antigua | No se extienden permisos ni se reutilizan identidades, folios o cupos |
| Folios agotados o certificado fiscal vencido | Alerta anticipada y aplicación del procedimiento permitido; nunca numeración improvisada |
| Rechazo fiscal posterior | Evidencia y cola de resolución con responsable; no borrar la venta ni declarar aceptado un documento rechazado |
| Reconexión masiva de tiendas | Drenaje medido, sin saturar ERP ni impedir nuevas ventas; prioridad según vencimientos fiscales |
| Desastre central y restauración | Replay idempotente, consultas de efectos externos y totales conciliados; RTO y RPO medidos |
| Sustitución de caja | Nueva identidad; restauración y conciliación antes de reasignar recursos; la caja anterior no vuelve a escribir el mismo turno |
| Fallo durante actualización local | Se conserva el ledger de ventas y la compatibilidad de esquema; reversión o reparación documentada |
| Acceso de una entidad a datos de otra | Rechazo por autorización en API y almacenamiento; auditoría del intento |
| Renombrado de esquema, tabla o campo con versiones antiguas activas | Consumidores antiguos y nuevos funcionan durante la transición; una caja que vuelve de una desconexión puede actualizarse y enviar pendientes sin pérdida |
| Traducción de un contrato POS a AX y al ERP futuro | Los casos acordados preservan importes, moneda, entidad legal, IDs y significado de estados; capacidades no soportadas producen un resultado explícito |
| Cambio de destino ERP con backlog o respuesta incierta | Cada operación conserva destino y política registrados; se comprueban efectos previos antes de reasignar, sin doble registro por un cambio global de configuración |
| Sucursal desconectada durante el corte ERP | Ventas tardías y maestros desactualizados se resuelven conforme a una política de migración probada; no se enrutan únicamente por el reloj de la caja |
| Devolución o pago posterior de una venta del ERP anterior | Se conserva referencia de origen y se utiliza el destino autorizado para la nueva operación, con conciliación entre referencias |
| Retorno a una fase anterior de migración ERP | Se concilian operaciones ya registradas en ambos entornos; se preservan ventas y documentos nuevos y no se restauran saldos antiguos indiscriminadamente |

En cada prueba se registran IDs, estados, importes, logs sin datos sensibles y resultados externos. El éxito exige coincidencia entre venta, caja, pago, documento fiscal y registro contable, o una excepción identificada con causa y responsable. «El mensaje llegó» no constituye por sí solo evidencia de conciliación.

## Validación de los servicios de IA candidatos

Estas pruebas corresponden al [diseño de IA](servicios-ia-pos.md); no se han ejecutado contra un modelo ni una implementación del POS. Se requieren casos anonimizados o sintéticos revisados por dueños de negocio, separados de los usados para ajustar prompts o modelos. Las metas se acuerdan después de medir la alternativa convencional y por país, rol y tipo de tarea; una demo convincente no acredita rendimiento productivo.

| Escenario | Evidencia de aceptación propuesta |
| --- | --- |
| Proveedor IA caído, cuota agotada o WAN perdida | La asistencia degrada a su alternativa explícita; ninguna venta ya autorizada espera a la IA ni cambia su estado por ese fallo |
| Fuente ausente, vencida o contradictoria | Abstención o limitación explicada; citas verificadas contra fragmento y versión; no inventa procedimiento, producto ni compatibilidad |
| Manual vigente para otro periférico, firmware o adaptador | Se excluye o identifica como inaplicable según perfil confiable instalado; el texto del usuario no altera capacidades ni versión efectiva del equipo |
| Migración ERP con códigos reutilizados e históricos coexistentes | Búsqueda y resúmenes conservan ID, entidad, origen y versión de mapeo; no fusionan productos u operaciones por similitud ni cambian cálculos deterministas |
| Documento/pedido/log incluye instrucciones maliciosas | Se trata como datos; no accede a secretos, herramientas o registros fuera de ámbito ni amplía privilegios |
| Usuario cambia de entidad/rol o se recupera contenido cacheado | Filtrado previo a recuperación/modelo, caché y citas; no exposición cruzada. Se respeta la vigencia de permisos offline |
| Repuesto parecido pero incompatibilidad verificada o desconocida | No recomienda como equivalente por similitud; exige evidencia de compatibilidad o identifica la incertidumbre |
| OCR confunde código, cantidad, unidad o separador decimal | Muestra el campo y su origen para revisión; borrador sin efectos; el núcleo valida datos, precio y permisos al usarlo |
| Pago o DTE con resultado incierto | El resumen conserva ese estado y referencias; no propone ni ejecuta reenvío, cobro o emisión como resolución automática |
| Modelo entrega SQL, HTML activo o comando de reparación | No se ejecuta; salida validada y representada como datos. Consultas de indicadores pertenecen a un catálogo autorizado |
| Cambio de modelo, prompt, corpus o índice | Evaluación por cohortes y errores críticos, comparación con versión anterior, trazabilidad y desactivación/rollback de IA sin tocar ventas |
| Inferencia/indexación local bajo carga de caja | Recursos acotados; no degrada la persistencia ni agota disco/memoria. Se conserva búsqueda/entrada manual al desactivar la IA |
| Telemetría y coste | Sin secretos ni contenido sensible crudo; versiones, latencia, uso y gasto por tarea útil observables, con presupuesto y límites verificables |

## Validación futura de RFID, conteos y autoservicio

La [evolución RFID](evolucion-rfid-autoservicio.md) permanece como posibilidad futura. Los ensayos de radio requieren artículos, etiquetas, lectores, antenas y mobiliario representativos, comparados con un conteo físico de referencia. La simulación de la presentación solo ilustra responsabilidades y deduplicación; no acredita precisión física ni preparación para producción.

| Escenario | Evidencia de aceptación propuesta |
| --- | --- |
| Muchas lecturas de una instancia y dos instancias del mismo SKU | Deduplicar identidad canónica por sesión; preservar dos unidades cuando el mapeo validado establece una por instancia. Una etiqueta de caja/kit no se interpreta como unidad individual |
| Revisiones de captura `{A}` → `{A,B}` → `{B}` y reentrega con otro comando | La segunda revisión incorpora solo B; la tercera no elimina A por ausencia. Conciliar por identidad y vínculo con líneas, conservar entradas manuales y rechazar revisiones concurrentes incompatibles |
| Dos cajas confirman simultáneamente la misma identidad | El escritor de sucursal detecta el conflicto de cestas atómicamente antes de otro cobro; un pago incierto no libera el vínculo por timeout. No se presenta este control local como reserva global de stock |
| Lecturas de cesta vecina, producto retirado o ruido intermitente | Zona y procedimiento validados; revisión explícita. La ausencia temporal no elimina una línea ni demuestra conteo completo |
| Mezcla de EPC serial y código de barras sin serial | Resolver la unidad física ya capturada; no deduplicar ni sumar ciegamente por SKU. Probar doble lectura y retirada en ambos modos |
| Etiqueta desconocida, dañada, clonada, sustituida o mapeo vencido | Excepción trazable y captura alternativa controlada; no SKU/precio inventado ni duplicación de la instancia |
| Dos sesiones, lector sustituido o respuesta tardía al cerrar cesta | Mantener sesión y versión de cesta; no cambiar importe durante pago ni incorporar lecturas antiguas en una venta nueva |
| Lector/WAN/LAN/servidor fallan en distintas etapas | Sesiones y candidatos recuperables dentro del perfil autorizado; fallback sin duplicados. Pérdida del escritor sigue deteniendo nuevas ventas en perfil WAN |
| Conteo offline llega después de movimientos de inventario | Dueño de inventario usa sesión, zona, corte temporal y movimientos para revisar diferencias; no reemplaza stock por el último mensaje recibido |
| Reenvío de la misma sesión de conteo y resultado parcial | Identidad y revisiones permiten deduplicar, mostrar cobertura y completar/rechazar según contrato; un artículo no leído no se vuelve stock cero |
| Metales, líquidos, orientación, embalajes y varias zonas activas | Medir omisiones, lecturas ajenas, duplicados y tiempo total con correcciones por combinación física; fijar umbrales con negocio antes del piloto |
| Ráfaga de lecturas y acumulación offline | Agregación y límites protegen CPU/disco/conexiones del escritor; degradación visible y recuperación sin perder evidencia necesaria |
| Autoservicio, si se aprueba | Probar permisos de cliente/supervisor, accesibilidad, abandono, pagos inciertos y entrega de documentos; detectar una etiqueta no valida el cobro ni habilita salida por sí solo |

## Pruebas específicas derivadas del código

Ejecutar en un entorno aislado con datos sintéticos, dobles de proveedores y, después, entornos de homologación. No usar ventas, cobros o documentos productivos para inyectar estos fallos. Los identificadores remiten a los [informes de repositorios](analisis-repositorios/README.md).

| Escenario | Evidencia de aceptación | Origen |
| --- | --- | --- |
| Precio/promoción remotos indisponibles y datos locales vigentes | Las operaciones habilitadas concluyen con cálculo local trazable; no existe llamada remota obligatoria ni reutilización silenciosa de una regla vencida. | MI-01, API-H08 |
| Paridad del motor de precios | Dataset cubre cantidades, grupos de cliente, vendedor, mínimos, históricos, vigencias, redondeos y datos faltantes; precio, descuento y reglas coinciden o tienen una diferencia comercial aprobada. | API-H08, API-H09 |
| Caché llena para cliente/folio A seguida de fallo al consultar B | B nunca recibe el dato de A; toda respuesta incompleta, antigua o desconocida se distingue y aplica la política monetaria acordada. | MI-02 |
| Dos solicitudes concurrentes reservan la misma NC; la primera pierde su respuesta | Una sola reserva válida dentro del alcance autorizado; reintento idempotente, propietario y expiración verificables, sin doble respuesta HTTP ni documentos duplicados. | PAG-01, PAG-07 |
| Pago con NC preparado en A y aún sin confirmación AX, consultado desde B | No desaparece el consumo pendiente por cambiar una marca de preparación; se prueban reservas locales, centrales y conciliación sin duplicar descuentos de saldo. | SYNC-03, PAG-05 |
| Una, varias o todas las sucursales de una consulta de saldo no responden | Se identifica cobertura/frescura y no se convierte error en saldo libre; se aplica la restricción acordada y se observa el límite de concurrencia. | PAG-04, PAG-06 |
| Caída del proceso después de recibir AMQP y antes/durante el commit | El mensaje se recupera o redelivery lo procesa una vez por identidad; el ACK solo sigue a persistencia durable. | SYNC-01 |
| Corte durante descarga, persistencia y acuse de un lote maestro | No se pierde el lote ni se activa parcialmente; recuperación demostrada con la política real de retención/reoferta central. | SYNC-02 |
| Caída entre creación de mensajes, marcas de negocio y confirmación AX | Estados convergen y no aparecen dos efectos por regenerar el ID técnico del mensaje; venta y pago se verifican por separado. | SYNC-03 |
| Consulta de existencia al bus expira y AX ya pudo registrar | Resultado desconocido, consulta/conciliación posterior; no se asume inexistencia para autorizar un nuevo efecto. | SYNC-06, API-H06 |
| Dos workers y varias conexiones del pool compiten por el mismo trabajo | Exclusión efectiva durante todo el trabajo, liberación verificable y recuperación tras caída; no dependen de adquirir/liberar un lock en sesiones diferentes. | SYNC-04 |
| Configuración de dependencia venta/pago, calendario y zona horaria | Matriz de valores booleanos/string y horarios, incluido domingo y cambio horario; pagos no se omiten por interpretar texto como booleano; backlog medido. | SYNC-08 y calendario |
| Duplicado o pago inválido retorna antes de guardar; DTE falla después del commit | No quedan transacciones abiertas; se conserva el commit ya realizado y un estado recuperable; un rollback posterior no aparenta deshacerlo. | MI-05 |
| Edición de oferta falla al recrear sus productos | Oferta y relaciones conservan una versión íntegra; guardados y commit se esperan antes de responder. | MI-06 |
| AX devuelve éxito exterior y error interior, respuesta incompleta o timeout | Resultado parcial/desconocido se conserva, no se declara contabilizado por el sobre exterior y se consulta el efecto antes de repetir. | API-H05, API-H06, API-H10 |
| Pago offline atraviesa cambio de día, periodo cerrado o corte ERP | Se conserva fecha del hecho y se aplica la política explícita de fecha contable y destino; nunca cambia por usar accidentalmente el reloj del worker. | API-H07 |
| Fallo RAW, excepción de impresión o pérdida de respuesta tras enviar al spooler | No se informa éxito físico sin evidencia; trabajo consultable, reimpresión identificada y ningún nuevo cargo o folio. | IMP-01, IMP-03 |
| Origen web no autorizado intenta usar el agente local | Rechazo según identidad/origen y autorización; CORS por sí solo no se acepta como autenticación. | IMP-02 |
| Solicitudes sin permiso y valores especiales en filtros SQL | Rutas protegidas en servidor y consultas parametrizadas; validación negativa en servicios aislados, sin operar bases reales. | MI-03, MI-04, SYNC-05, API-H02, API-H03, PAG-02 |

Antes de ejecutar, registrar el commit/artefacto del candidato y acordar los resultados esperados con operación y finanzas. Los valores de secretos no forman parte de los datasets, logs ni informes de prueba. La ausencia de incidentes conocidos no sustituye estas evidencias.

## Validación de opciones tecnológicas

Para evaluar [NestJS/Fastify, Pino/Sentry, Tauri, Nx y monolito modular](opciones-tecnologicas.md), añadir estas comprobaciones al piloto; son pruebas propuestas, todavía no ejecutadas:

| Escenario de adopción | Evidencia requerida |
| --- | --- |
| NestJS/Fastify con transacciones y workers representativos | Contratos y resultados equivalentes, latencia/CPU/memoria/conexiones medidas en hardware homologado y recuperación al reiniciar. |
| Caída de Sentry/destino de logs y saturación del almacenamiento de telemetría | Las ventas y commits continúan conforme a su política; memoria/disco acotados, recuperación de envío y descarte/retención explícitos. |
| Correlación de HTTP, jobs e intentos de integración | Contextos separados, IDs consistentes, una captura por error según política y ausencia de secretos/datos personales innecesarios. |
| Instalación y arranque de Tauri sin Internet | Recursos de interfaz y dependencias disponibles, WebView2 gestionado y comportamiento correcto para el perfil offline elegido. |
| Periféricos desde Tauri | Impresión, reimpresión, lector y pagos homologados con hardware/SDK reales; resultados y permisos de los agentes verificados. |
| Cierre de ventana, caída del proceso y actualización fallida | Trabajos recuperables según su ciclo de vida, persistencia conservada, convivencia de versiones y ningún cobro/documento repetido. |
| Importación prohibida o ciclo entre módulos | CI rechaza la dependencia entre proyectos; reglas y responsables explícitos. Complementar lint con verificación de propiedad de datos y contratos. |
| Cambio de contrato y caja con versión anterior | Verificaciones relevantes de productor/consumidores se ejecutan; el despliegue central sigue siendo compatible con los clientes admitidos aunque compartan monorepo. |
| Caché y tareas afectadas de Nx | Grafo, entradas, toolchains y plataforma representados; resultados reproducibles y ninguna omisión de pruebas necesarias ni cacheo de efectos de despliegue/migración. |

## Validación de componentes corporativos candidatos

La [revisión de plataforma](analisis-repositorios/aportes-plataforma-corporativa.md) añade escenarios concretos. Son verificaciones futuras en entornos controlados; no se ejecutaron contra la empresa durante esta revisión.

| ID | Escenario | Criterio para reutilizar |
| --- | --- | --- |
| CORP-01 | Producir un efecto ERP y perder la respuesta con timeout/reset de conexión. | Una identidad estable permite consultar/conciliar; ningún reintento repite el efecto. El código de socket no se toma como prueba de que nada fue procesado. |
| CORP-02 | Caer entre el cambio de negocio y el guardado del evento, y entre publicar y marcar outbox. | Commit común para negocio/outbox local; reentrega deduplicada duraderamente. Verificar cada consumidor, no solo la biblioteca. |
| CORP-03 | Dos consumidores/requests concurrentes; expira un lock mientras el primero sigue ejecutando. | No se habilitan dos efectos incompatibles; dueño/lease/fencing según diseño y TTL coherente con tiempos reales. |
| CORP-04 | Desconectar WAN, Redis, identidad central y telemetría con el paquete local de ofertas vigente. | Continúan las operaciones offline autorizadas; dependencias ausentes no impiden el arranque local conforme a su política. Captura financiera durable independiente de logs. |
| CORP-05 | Publicar revisión central con cero tráfico solicitado, y fallar antes o durante la consulta de estado/smoke. | La revisión nueva no recibe tráfico de clientes antes de promoción; se verifica el tráfico por revisión y no por posición de un array. |
| CORP-06 | Falla una prueba/lint y aparece además un mensaje de error del caché remoto en el log. | El error de la comprobación conserva un resultado fallido; tolerar caché caído no convierte errores de calidad en éxito. |
| CORP-07 | Restaurar artefactos y secretos de un release anterior. | Digest y versiones de configuración/secretos reproducibles bajo política; integridad y compatibilidad de esquema comprobadas. Restaurar un binario no elimina transacciones posteriores. |
| CORP-08 | Consumidor POS atrasado y cambio de contrato/moneda/precios central. | Versiones admitidas interoperan, valores monetarios conservan semántica, y cálculo local se contrasta con casos aprobados de cada país/canal. |

## Dimensionamiento y coste

Recopilar por país tiendas, cajas por tienda, ventas por minuto en pico, líneas por ticket, eventos por venta, tamaño de documentos, catálogo, retención y velocidad mínima de red. Medir los tamaños serializados y de disco; no calcular almacenamiento solo con el JSON del evento.

La primera estimación local es `ventas por minuto × minutos offline × bytes persistidos por venta × factor de reserva`, más catálogo, índices, WAL, auditoría, imágenes y backups. El factor de reserva se fija con las mediciones. El nodo de tienda acumula las cajas que respalda; la plataforma debe recibir tráfico nuevo y backlog simultáneamente.

Para un backlog `B`, caudal de procesamiento `C` y llegada nueva `R`, el tiempo aproximado de vaciado es `B / (C - R)` si `C > R`, usando unidades consistentes. Medir cada cuello de botella: sincronización, validación fiscal y ERP pueden drenar a velocidades diferentes. Las fechas límite fiscales tienen prioridad sobre un simple orden de llegada global.

El coste total debe incluir terminales y repuestos, nodo de tienda y energía protegida, conectividad, infraestructura de país, backups, licencias, proveedores fiscales, pagos, soporte, observabilidad y mantenimiento de las integraciones actuales. Añadir el futuro conector al ERP común, mapeos, compatibilidad y operación durante la coexistencia; el número definitivo de adaptadores depende del alcance y las instancias. Cotizar después del inventario y de una prueba de volumen; cloud y on-premise comparten componentes lógicos, pero cambian capacidad, operación y costes.

## Decisiones que debe cerrar el proyecto

La [solicitud de información al equipo](solicitud-informacion-equipo.md) convierte estas decisiones en preguntas priorizadas, responsables sugeridos y evidencias concretas, con una plantilla para responder por país.

| Prioridad | Decisión o dato faltante | Responsable sugerido | Impacto |
| --- | --- | --- | --- |
| Antes de fijar infraestructura | Alcance de «No Cloud» en Chile | Arquitectura y seguridad | Ubicación de plataforma, conectividad y servicios administrados |
| Antes de cerrar integración española | Gira confirmado: validar versión, despliegue, capacidades e interfaces | Negocio y TI de España | Autoridad de inventario, contabilidad, facturación y contrato |
| Antes de desarrollar conector chileno | Versión, CU, módulos y personalizaciones de AX; interfaces disponibles | TI de Chile y equipo AX | Protocolo, extensiones y soporte |
| Antes de desarrollar conector peruano | Interfaces, transacciones y responsable del custom | TI de Perú | Idempotencia, cambio de maestros y confirmación de asientos |
| Antes de comprometer continuidad | Duración offline y escenarios WAN, LAN, energía y pérdida de equipo | Operaciones y arquitectura | Garantías de venta, segunda copia, RPO y hardware |
| Antes del piloto | Tiendas, cajas, picos, periféricos y conectividad | Operaciones | Dimensionamiento y stack del cliente |
| Antes de elegir componentes | Inventario de seis aplicaciones y de Angular, AdonisJS, .NET, Java, bus y bases existentes | Arquitectura y equipos actuales | Reutilización, actualización, límites y ruta de migración |
| Antes de trasladar hallazgos a producción | Commits/artefactos desplegados y configuración efectiva; `main` es probable según el usuario, pero no existe en tres repositorios consultados | Equipos de desarrollo y operaciones | Determina qué caminos revisados están activos y permite reproducir los fallos sin asumir equivalencias |
| Antes de diseñar el corte de NC | Autoridad de saldo, exclusión de reservas, significado de preparación/confirmación y cobertura de sucursales | Finanzas, caja e integración | Evita omitir consumo pendiente o autorizar uso sobre datos incompletos |
| Antes de habilitar cada país | Sociedades, establecimientos, documentos y modalidad fiscal | Responsable tributario local | Emisión, numeración, firma, plazos y contingencias |
| Antes de habilitar pagos | Adquirentes, dispositivos, medios y reglas offline | Pagos, finanzas y seguridad | Riesgo, certificación requerida y recuperación de resultados inciertos |
| Antes de publicar maestros | Dueño por atributo y vigencia permitida de datos | Comercial, inventario y finanzas | Conflictos de precio, impuestos, catálogo y stock |
| Antes de implementar ofertas locales | Evaluar y aplicar, o también crear y modificar campañas; reglas de acumulación y límites | Comercial y operaciones | Motor local, permisos y autoridad de cambios |
| Antes del piloto chileno | Ciclo de reserva de inventario y relación entre DTE, pago y deuda registrada en AX | Inventario, fiscal y finanzas | Liberación, compensaciones y conciliación del desfase |
| Antes de permitir funciones sensibles offline | Cupos, descuentos, devoluciones y permisos | Negocio y seguridad | Riesgo de doble consumo y ventana de revocación |
| Antes de producción | Retención, transferencias y acceso a datos personales | Privacidad y seguridad | Configuración, archivo y analítica |
| Antes de producción | Soporte, SLA, responsables y escalamiento por país | Operaciones TI | Resolución de ventas pendientes y continuidad fuera de horario |
| Antes de aprobar estándares | Glosario, idioma de identificadores y naming de código y persistencia; alcance y compatibilidad de renombrados | Arquitectura y equipos de desarrollo y datos | Convenciones por lenguaje y motor, migraciones y consumidores antiguos |
| Antes de cerrar límites de integración | Capacidades de las fachadas, contratos del POS y traducciones de cada ACL | Arquitectura, negocio e integración | Independencia semántica, responsabilidades y pruebas de contrato |
| Antes de comprometer inversión específica en ERP | Producto destino, alcance, instancias y fecha del posible inicio por Chile; 2027 es tentativo | Programa ERP, TI corporativa y negocio | Reutilización de adaptadores actuales y coordinación de las migraciones POS y ERP |
| Antes del corte ERP | Autoridades de maestros, destino por operación, ventas offline tardías, documentos previos y retorno de fase | Programa ERP, operaciones e integración | Coexistencia sin pérdida ni doble registro, conciliación y retirada de conectores |

## Riesgos principales y tratamiento

| Riesgo | Tratamiento y criterio para avanzar |
| --- | --- |
| «Offline» se interpreta como cualquier operación sin límites | Aprobar matriz de capacidades por escenario, país, pago y documento |
| Las capacidades de integración de Gira no cubren las operaciones requeridas | Validar contratos y autoridad por operación; acordar las extensiones o integraciones necesarias antes de comprometer el alcance |
| AX o custom no previenen registros duplicados | Extender unicidad y consulta transaccional; no aceptar reintentos ciegos |
| Destrucción de la única copia de ventas | Segunda copia cuando hay red, protección física y aceptación explícita del tramo en riesgo |
| Folios, certificados o plazos incompatibles con la autonomía | Medir capacidad fiscal disponible, alertar y limitar operaciones según el procedimiento permitido |
| Reconexión satura sistemas legacy | Límites por destino, drenaje controlado y ensayos de carga |
| Restauración revive permisos, folios o cupos consumidos | Identidad de ejecución nueva, cuarentena y conciliación antes de reactivar |
| Exceso de componentes eleva el coste operativo | Núcleo modular, automatización y extracción de servicios basada en evidencia |
| Renombrados rompen cajas o integraciones antiguas | Inventariar consumidores, ampliar compatibilidad antes del cambio y retirar nombres anteriores tras verificar versiones y pendientes |
| Corte ERP reenvía pendientes al destino equivocado | Registrar destino y política por operación, conciliar resultados inciertos y ensayar ventas offline tardías |
| Calendario ERP cambia o el producto no está decidido | Priorizar contratos y límites reutilizables, manteniendo el horizonte tentativo y revisando inversiones específicas por etapa |

## Etapas de entrega

1. **Descubrimiento y contratos.** Cerrar las decisiones críticas, mapa de autoridades de datos, perfil offline, hardware y regímenes fiscales. Inventariar las aplicaciones y flujos existentes de Chile, incluyendo ofertas y reserva de inventario. Acordar glosario, convenciones y límites de integración, e incorporar el calendario tentativo del programa ERP. Entregar diagramas de despliegue concretos y contratos con ejemplos; estimar esfuerzo y coste con estos datos.
2. **Prueba vertical de mayor riesgo.** Venta local, pago con respuesta incierta, emisión del documento seleccionado, sincronización y asiento en un entorno de pruebas de AX. Chile sigue como candidato inicial del piloto POS, considerando también la intención de comenzar allí la migración ERP. Confirmar la secuencia de ambos programas: el piloto POS no demuestra por sí solo que el nuevo ERP esté listo.
3. **Piloto controlado.** Tienda y equipos representativos, inyección de fallos, cierres y conciliación. Evitar emitir dos documentos fiscales o cobrar dos veces al comparar con el POS anterior; definir cuál es el sistema activo.
4. **Extensión a los tres países.** Incorporar adaptadores, modalidades fiscales y proveedores de pago con sus propias evidencias de validación. Un piloto exitoso en un país no acredita los otros.
5. **Despliegue gradual y operación.** Anillos de tiendas, monitoreo, runbooks, restauración ensayada y soporte habilitado. Para volver al sistema anterior, reconciliar pendientes y números fiscales; no hacer un rollback de datos indiscriminado.

La migración al ERP común tiene un calendario propio todavía tentativo. Cuando se defina el destino, se validarán sus mapeos y contratos, se ensayará la coexistencia y el corte en Chile, y se incorporarán los demás países conforme al programa aprobado. No se asigna aquí una fecha de sustitución de AX ni un orden entre Perú y España.

El paquete para aprobar producción comprende contratos versionados, matriz de capacidades offline, evidencias de pruebas, conciliación de cierres, controles de seguridad, procedimientos fiscales validados, plan de recuperación, costo estimado y responsables de soporte. Esta propuesta constituye la base de ese paquete, no sustituye su ejecución.
