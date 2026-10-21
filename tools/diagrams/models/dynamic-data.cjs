'use strict';

// Vistas dinámicas complementarias: participantes del nivel C2, sin añadir un nivel C4.
module.exports = [
  {
    id: 'prices',
    number: '06',
    title: 'D1 · Publicación y activación de precios',
    scope: 'Desde la fuente autorizada hasta una cotización con versión fijada. La misma publicación controlada atiende deltas, carga masiva programada y recuperación manual.',
    note: 'Secuencia objetivo recomendada, no implementación acreditada. El propietario de cada dato y su contrato se confirman por país. El espejo de sucursal es de lectura y no se convierte en un maestro independiente.',
    participants: [
      { id: 'masters', nodeId: 'masters', name: 'Fuentes de maestros y precios', type: 'Sistema externo', technology: 'Interfaces por confirmar', summary: 'Entrega catálogo, impuestos, precios y promociones aprobados por su propietario.' },
      { id: 'countryWorker', nodeId: 'countryWorker', name: 'Workers de país', type: 'Contenedor', technology: 'Workers NestJS / Node.js', summary: 'Ingiere fuentes autorizadas y prepara publicaciones completas y versionadas.' },
      { id: 'countryDb', nodeId: 'countryDb', name: 'Datos operativos de país', type: 'Contenedor de datos', technology: 'PostgreSQL', summary: 'Conserva versiones inmutables, manifiestos y deltas con un corte consistente.' },
      { id: 'countryApi', nodeId: 'countryApi', name: 'API de país', type: 'Contenedor', technology: 'NestJS + Fastify / Node.js', summary: 'Autentica sucursales y sirve publicaciones por contrato y cursor.' },
      { id: 'syncWorker', nodeId: 'syncWorker', name: 'Sincronizador de sucursal', type: 'Contenedor', technology: 'Worker TypeScript / Node.js', summary: 'Recibe, prepara y valida candidatas antes de activar un espejo local.' },
      { id: 'branchDb', nodeId: 'branchDb', name: 'Datos de sucursal', type: 'Contenedor de datos', technology: 'PostgreSQL', summary: 'Guarda staging, inbox, cursores y versiones de lectura en la base compartida.' },
      { id: 'branchApi', nodeId: 'branchApi', name: 'Backend de sucursal', type: 'Contenedor', technology: 'NestJS + Fastify / Node.js', summary: 'Cotiza y confirma operaciones con datos y políticas vigentes.' },
      { id: 'client', nodeId: 'client', name: 'Cliente de caja', type: 'Contenedor', technology: 'Angular + Tauri', summary: 'Solicita una cotización por LAN y presenta su versión y resultado.' }
    ],
    steps: [
      { from: 'countryWorker', to: 'masters', label: 'Obtiene cambios o carga completa autorizada', note: 'Interfaz por confirmar; el contrato identifica origen, cobertura, versión y vigencia. La secuencia no presupone CDC ni un broker.' },
      { from: 'countryWorker', to: 'countryWorker', label: 'Construye y valida una publicación inmutable', note: 'Combina datos autorizados y verifica integridad y compatibilidad. Un cambio parcial no se declara publicación completa.' },
      { from: 'countryWorker', to: 'countryDb', label: 'Publica versión, manifiesto y outbox · transacción SQL', note: 'La publicación y su evento se confirman juntos; el feed conserva los deltas. El manifiesto registra un watermark: corte consistente de origen desde el que recuperarlos. Una hora arbitraria del proceso no sustituye este corte.' },
      { from: 'syncWorker', to: 'countryApi', label: 'Solicita deltas o snapshot · HTTPS autenticado', note: 'Usa identidad de sucursal y país, contrato y cursor durable. Una carga completa puede ser programada o solicitada como recuperación manual controlada.' },
      { from: 'countryApi', to: 'countryDb', label: 'Lee la publicación y su corte consistente · SQL', note: 'Selecciona la cobertura autorizada para esa sucursal y entrega una versión identificable, con manifiesto y deltas compatibles.' },
      { from: 'countryApi', to: 'syncWorker', label: 'Devuelve manifiesto, deltas o chunks · HTTPS', note: 'La respuesta permite verificar versión, esquema, cobertura, watermark y checksum. Recibir bytes no significa haber aplicado los datos.' },
      { from: 'syncWorker', to: 'branchDb', label: 'Persiste recepción y staging · transacciones SQL cortas', note: 'Guarda inbox recibida, staging y cursor de recepción para reanudar. No cambia la versión activa ni el cursor aplicado.' },
      { from: 'syncWorker', to: 'syncWorker', label: 'Prepara candidata aislada y reproduce deltas posteriores', note: 'Los deltas incluyen altas, cambios y bajas explícitas (tombstones). Parten de una base conocida; el snapshot recupera deltas posteriores a su watermark. Nunca se parchea la versión activa en servicio.' },
      { from: 'syncWorker', to: 'syncWorker', label: 'Valida la candidata completa antes de publicarla', note: 'Comprueba checksum, cobertura, referencias, orden, compatibilidad y vigencia. Descarga y validación pesada ocurren fuera de la transacción final; la candidata validada queda identificada e inmutable.' },
      { from: 'syncWorker', to: 'branchDb', label: 'Activa versión + inbox aplicada + cursor aplicado · commit SQL', note: 'Un commit corto revalida base y checkpoint; un snapshot atrasado no hace retroceder el puntero ni el cursor aplicado. Activa efecto y checkpoint juntos; conserva versiones todavía referenciadas.' },
      { from: 'client', to: 'branchApi', label: 'Solicita cotización · HTTPS sobre LAN', note: 'Envía artículos, cantidades y contexto autorizado; no consulta directamente el SQL ni recalcula precios con autoridad propia.' },
      { from: 'branchApi', to: 'branchDb', label: 'Lee la versión vigente y fija su referencia · SQL', note: 'Verifica cobertura, vigencia y política. La cotización conserva versión, origen y reglas; al confirmar se revalida que la operación siga permitida.' },
      { from: 'branchApi', to: 'client', label: 'Devuelve importes y versión de la cotización · HTTPS', note: 'Las nuevas operaciones usan la versión activa; una venta abierta conserva la versión fijada. Un cambio de política exige resolución explícita, no una sustitución silenciosa.' }
    ],
    notes: [
      { title: 'Recibido y aplicado son estados distintos', body: 'La inbox y el cursor de recepción permiten reanudar una descarga. Solo el commit de activación confirma inbox aplicada, efecto y cursor aplicado. Deltas y snapshots atraviesan el mismo control de publicación; deduplicar no autoriza a activar.' },
      { title: 'Huecos, incompatibilidad o carga incompleta', body: 'Bloquean la nueva publicación. Se conserva evidencia, se solicita replay o snapshot y se reutiliza staging válido cuando proceda. No se salta un hueco ni se publica una mezcla parcial de versiones.' },
      { title: 'Frescura y vigencia son límites distintos', body: 'El TTL de frescura y la vigencia comercial se validan por separado; ambos deben cumplirse. Una carga fallida conserva la versión previa solo mientras siga autorizada. Redescargar la misma versión no reinicia plazos. Sin datos válidos se bloquea la operación afectada.' },
      { title: 'Reconciliación programada y recuperación manual', body: 'La frecuencia de carga completa es configurable. Ambas rutas usan manifiesto, corte consistente, retención de deltas, staging, validación y activación atómica. La reconciliación detecta divergencias sin convertir una sucursal en autora del maestro.' },
      { title: 'WAN caída; LAN y servidor disponibles', body: 'La sucursal cotiza sobre su espejo autorizado mientras datos, permisos y capacidades sigan vigentes. Si cae la LAN o el backend se detienen los comandos dependientes; no aparece otra base ni otro escritor en cada terminal.' },
      { title: 'Replay, bajas y restauración', body: 'La entrega puede repetirse y se deduplica. Tombstones, versiones referenciadas y evidencia se retienen durante el horizonte de replay y recuperación para no resucitar bajas. Un restore puede retroceder datos y cursores: se concilia con origen antes de declarar convergencia.' }
    ]
  },
  {
    id: 'sale',
    number: '07',
    title: 'D2 · Confirmación de venta y entrega durable',
    scope: 'Venta con pago por API habilitada: intención durable, resultado del proveedor, commit local y entrega asíncrona hasta el ACK de aplicación de país. La integración ERP continúa después.',
    note: 'Secuencia objetivo recomendada con resultado de pago conocido. Cada flecha representa una interacción; no una transacción distribuida. Venta, pago, fiscalidad, entrega a país y contabilización ERP conservan estados separados.',
    participants: [
      { id: 'client', nodeId: 'client', name: 'Cliente de caja', type: 'Contenedor', technology: 'Angular + Tauri', summary: 'Envía comandos identificados y presenta el resultado durable al operador.' },
      { id: 'branchApi', nodeId: 'branchApi', name: 'Backend de sucursal', type: 'Contenedor', technology: 'NestJS + Fastify / Node.js', summary: 'Autoriza la operación y coordina negocio, pago y evidencia local.' },
      { id: 'branchDb', nodeId: 'branchDb', name: 'Datos de sucursal', type: 'Contenedor de datos', technology: 'PostgreSQL', summary: 'Custodia intención, venta, caja, auditoría y outbox en un primario compartido.' },
      { id: 'payments', nodeId: 'payments', name: 'Proveedor de pagos', type: 'Sistema externo', technology: 'API / SDK según proveedor', summary: 'Informa resultado y referencia; la consulta posterior está sujeta a homologación.' },
      { id: 'syncWorker', nodeId: 'syncWorker', name: 'Sincronizador de sucursal', type: 'Contenedor', technology: 'Worker TypeScript / Node.js', summary: 'Entrega outbox confirmada y conserva identidad durante reintentos.' },
      { id: 'countryApi', nodeId: 'countryApi', name: 'API de país', type: 'Contenedor', technology: 'NestJS + Fastify / Node.js', summary: 'Valida el contrato y confirma inbox, efecto local y outbox antes de acusar aplicación.' },
      { id: 'countryDb', nodeId: 'countryDb', name: 'Datos operativos de país', type: 'Contenedor de datos', technology: 'PostgreSQL', summary: 'Guarda proyección de la venta, deduplicación y trabajo posterior de integración.' }
    ],
    steps: [
      { from: 'client', to: 'branchApi', label: 'Solicita confirmar venta · HTTPS sobre LAN', note: 'Con commandId estable, contexto de caja y referencia de cotización. Un reintento conserva la identidad del comando.' },
      { from: 'branchApi', to: 'branchDb', label: 'Lee y valida turno, permisos, precios y capacidad · SQL', note: 'Valida importes, versión fijada, vigencia, política offline, espacio, reloj y recursos fiscales requeridos. El cliente no decide la autorización ni el importe final.' },
      { from: 'branchApi', to: 'branchDb', label: 'Persiste intención de venta y pago · commit SQL', note: 'Asigna identidades estables antes del efecto externo y guarda importe, moneda, destino y contexto suficiente para recuperar el intento.' },
      { from: 'branchApi', to: 'payments', label: 'Ejecuta el intento autorizado · API habilitada', note: 'Usa la referencia original; idempotencia y consulta dependen de capacidades disponibles y homologadas. La llamada ocurre sin mantener una transacción SQL abierta.' },
      { from: 'payments', to: 'branchApi', label: 'Devuelve resultado conocido y referencia · API', note: 'La continuación mostrada requiere un resultado suficiente para confirmar según política. Rechazo o respuesta desconocida siguen su estado y recuperación propios.' },
      { from: 'branchApi', to: 'branchDb', label: 'Confirma venta + caja + auditoría + outbox · un commit SQL', note: 'Revalida invariantes y deduplicación; persiste partidas, impuestos, referencias de pago y evidencia fiscal que deba ser simultánea. El commit no incluye al proveedor externo ni al ERP.' },
      { from: 'branchApi', to: 'client', label: 'Confirma operación y documento permitido · HTTPS', note: 'Solo después del commit local. Muestra estados de pago, fiscalidad e integración; la entrega a país puede permanecer pendiente sin negar la venta ya confirmada.' },
      { from: 'syncWorker', to: 'branchDb', label: 'Lee outbox confirmada y reclama lote acotado · SQL', note: 'El claim o lease técnico es recuperable. No mantiene una transacción abierta durante el envío ni altera libremente las ventas.' },
      { from: 'syncWorker', to: 'countryApi', label: 'Envía lote con eventId y secuencia · HTTPS autenticado', note: 'Incluye país, sucursal, versión de contrato e identidad estable del evento. La entrega es al menos una vez; un reintento no fabrica otra venta.' },
      { from: 'countryApi', to: 'countryApi', label: 'Valida emisor, contrato, orden e identidad', note: 'Autentica el ámbito y comprueba el contrato. La decisión definitiva de deduplicación y sus restricciones se aplica dentro del commit siguiente.' },
      { from: 'countryApi', to: 'countryDb', label: 'Aplica inbox + efecto local + outbox · una transacción SQL', note: 'Registra la proyección requerida y el trabajo posterior junto con la deduplicación. Un duplicado ya aplicado conserva su resultado; igual ID con contenido distinto es conflicto, no éxito.' },
      { from: 'countryDb', to: 'countryApi', label: 'Confirma commit y resultado durable · SQL', note: 'Solo este resultado permite afirmar aplicación local en país. Guardar únicamente recepción no basta para emitir el ACK de aplicación.' },
      { from: 'countryApi', to: 'syncWorker', label: 'Devuelve ACK de aplicación por evento · HTTPS', note: 'Identifica eventos aplicados, duplicados equivalentes y rechazos. No declara pago liquidado, validez fiscal ni documento contabilizado en ERP.' },
      { from: 'syncWorker', to: 'branchDb', label: 'Persiste acuse y avance de entrega · commit SQL', note: 'Actualiza estados técnicos y checkpoint de eventos realmente acusados. Mantiene pendientes no confirmados y evidencia durante el horizonte de retención y recuperación.' },
      { from: 'client', to: 'branchApi', label: 'Consulta estado local e integración pendiente · HTTPS LAN', note: 'La consulta distingue venta confirmada, entrega a país e integración ERP. El avance posterior de workers y adaptador ERP usa la outbox de país, fuera del alcance de esta secuencia.' }
    ],
    notes: [
      { title: 'Pago desconocido o aprobado sin commit local', body: 'Un timeout conserva el intento y su incertidumbre: consulta o conciliación según capacidad, sin recargar ni cambiar automáticamente de proveedor. Si el pago se aprobó y falla el commit local, se recuperan intención y evidencia; una reversa o intervención controlada conserva el intento original.' },
      { title: 'SDK local es una ruta condicional', body: 'La vista muestra una API ejecutada desde backend. Si el proveedor exige SDK local homologado, el cliente transporta al puente de periféricos el comando original autorizado por backend y retorna evidencia. No inventa importe o permiso, ni ejecuta ambas rutas para un mismo intento.' },
      { title: 'Fiscalidad e impresión tienen su propio resultado', body: 'Solo se confirman operaciones y documentos permitidos por la modalidad nacional habilitada. Las llamadas fiscales conservan referencia, estado y recuperación fuera de una transacción distribuida. Un fallo de impresión permite reimprimir el mismo documento; no genera otra venta ni otro cargo.' },
      { title: 'Caída WAN frente a caída LAN', body: 'Sin WAN la outbox permanece durable y se permiten solo operaciones soportadas por datos, autenticación, pago y fiscalidad vigentes. Sin LAN, backend o escritor autorizado se detiene el comando dependiente. Ninguna terminal crea por ello una base o autoridad alternativa.' },
      { title: 'ACK perdido, replay y restore', body: 'Un ACK perdido provoca reentrega del mismo eventId; país deduplica en la transacción del efecto. Un hueco o conflicto queda pendiente para resolver. La retención y conciliación cubren restauraciones que retrocedan inbox, datos o cursores; no se promete exactly-once universal.' },
      { title: 'ERP posterior no es el ACK de país', body: 'Workers de país consumen outbox ya confirmada y usan el adaptador ERP/ACL con destino y referencia persistidos. Registro, rechazo, contabilización y conciliación tienen estados propios. La caída del ERP deja integración pendiente; país no se convierte en segundo autor de la venta local.' }
    ]
  }
];
