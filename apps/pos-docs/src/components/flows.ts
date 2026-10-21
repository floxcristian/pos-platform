export type FlowNodeState = 'idle' | 'active' | 'done' | 'waiting';

export interface FlowStep {
  title: string;
  description: string;
  confirmed: string;
  pending: string;
  route?: string;
  code: string;
  nodes: { state: FlowNodeState; status: string }[];
}

export interface FlowScenario {
  title: string;
  description: string;
  boundary: string;
  nodes: { title: string; detail: string }[];
  steps: FlowStep[];
}

/** Examples of the proposed contracts, not an execution trace from production. */
export const flows: Record<'sale' | 'pricing', FlowScenario> = {
  sale: {
    title: 'Una venta, varias confirmaciones',
    description: 'Venta en efectivo autorizada, con LAN y servidor de sucursal disponibles. La WAN falla y una respuesta se pierde: cada participante conserva un estado distinto.',
    boundary: 'Pseudocódigo e IDs sintéticos: sale identifica la venta; cmd, su solicitud; evt, un evento; op-erp y attempt-erp, la integración y su intento. Este ejemplo usa efectivo, no un cargo a un adquirente. La recepción central no acredita aceptación fiscal ni contabilización.',
    nodes: [
      { title: 'Caja', detail: 'Cliente y operador' },
      { title: 'Sucursal', detail: 'Backend + PostgreSQL' },
      { title: 'País', detail: 'Recepción durable' },
      { title: 'ERP', detail: 'Sistema externo' },
    ],
    steps: [
      {
        title: 'La sucursal valida la operación',
        description: 'El backend verifica identidad, alcance, turno y versión de precios. El operador registra el efectivo recibido según la política acordada. La continuidad depende de que esta operación esté habilitada sin WAN.',
        confirmed: 'Hay una solicitud identificada y una versión de precios seleccionada.',
        pending: 'La venta aún no está guardada. Los requisitos fiscales se resuelven según el perfil de país.',
        route: 'Caja → backend de sucursal · solicitud autenticada',
        code: 'saleId = "sale-1042"\ncommandId = "cmd-confirm-sale-1042"\npricingVersion = "prices-41"',
        nodes: [{ state: 'active', status: 'Solicitud enviada' }, { state: 'active', status: 'Validando reglas' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'Venta y outbox quedan en el mismo commit',
        description: 'La unidad de trabajo escribe la venta y el evento pendiente usando la misma transacción PostgreSQL. Si falla el commit, no se confirma la venta. No existe una llamada al ERP dentro de esa transacción.',
        confirmed: 'La venta sale-1042 está persistida y su evento evt-sale-1042-confirmed está en la outbox.',
        pending: 'La entrega al país y el registro ERP siguen pendientes.',
        route: 'PostgreSQL de sucursal → caja · confirmación local',
        code: 'BEGIN;\n  guardar_venta(saleId, commandId);\n  guardar_outbox("evt-sale-1042-confirmed", saleId);\nCOMMIT;',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Venta + outbox durables' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'Sin WAN, el pendiente se conserva',
        description: 'El worker de sucursal no consigue entregar el evento por HTTPS. Programa otro intento y mantiene la identidad original. La venta local no se borra ni se convierte en una venta nueva.',
        confirmed: 'La venta y el evento permanecen en PostgreSQL de sucursal.',
        pending: 'No existe confirmación de recepción central. La LAN y el servidor local deben seguir disponibles.',
        code: 'eventId = "evt-sale-1042-confirmed"\nsaleId = "sale-1042"\ndeliveryStatus = "pending"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'waiting', status: 'Outbox pendiente · sin WAN' }, { state: 'idle', status: 'Sin recepción' }, { state: 'idle', status: 'Sin registro' }],
      },
      {
        title: 'El país confirma su propia transacción',
        description: 'Al volver la conexión, el receptor verifica identidad y contrato. Guarda inbox, registro operativo de la venta recibida y trabajo de integración en una transacción. Ese es el efecto local pactado; la llamada ERP queda fuera. Solo después del commit emite el ACK.',
        confirmed: 'El país confirmó el evento, el registro operativo y el trabajo para integrar la venta.',
        pending: 'La sucursal todavía debe recibir el ACK. La integración ERP aún no ha terminado.',
        route: 'Sucursal → país · evt-sale-1042-confirmed por HTTPS',
        code: 'BEGIN;\n  guardar_inbox(eventId);\n  guardar_venta_recibida(saleId);\n  guardar_trabajo_durable("op-erp-1042", saleId);\nCOMMIT; // recién ahora: ACK',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'waiting', status: 'Esperando ACK' }, { state: 'done', status: 'Inbox + efecto + outbox' }, { state: 'idle', status: 'Pendiente de integración' }],
      },
      {
        title: 'La respuesta se pierde; el evento se reintenta',
        description: 'La sucursal no puede saber si el país alcanzó a guardar la solicitud. Reenvía el mismo evento. El receptor reconoce origen, consumidor e ID, comprueba el contenido y responde sin repetir el efecto.',
        confirmed: 'La inbox del país identifica una entrega repetida del mismo evento.',
        pending: 'Falta que el ACK llegue a la sucursal. Un ID reutilizado con otro contenido debe rechazarse.',
        route: 'Sucursal → país · reintento con la misma identidad',
        code: 'dedupKey = [origin, consumer, eventId]\nsi_existe_mismo_contenido → no_repetir_efecto()',
        nodes: [{ state: 'done', status: 'Una sola venta' }, { state: 'active', status: 'Reenvía el mismo evento' }, { state: 'done', status: 'Duplicado reconocido' }, { state: 'idle', status: 'Pendiente de integración' }],
      },
      {
        title: 'El ACK resuelve la entrega central',
        description: 'La sucursal marca la recepción confirmada después de validar el ACK. Conserva los registros según una política de retención y recuperación: recibir un ACK no implica borrar inmediatamente la evidencia.',
        confirmed: 'La sucursal sabe que el país persistió el evento.',
        pending: 'El resultado ERP, el fiscal y el de pago se consultan y actualizan por separado.',
        route: 'País → sucursal · ACK después del commit',
        code: 'deliveryStatus = "acknowledged"\nerpStatus = "pending"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Entrega confirmada' }, { state: 'done', status: 'Custodia durable' }, { state: 'waiting', status: 'Aún pendiente' }],
      },
      {
        title: 'Un timeout ERP deja un resultado desconocido',
        description: 'Antes de enviar, el worker persiste la operación de integración, su intento y la referencia externa estable. Si el ERP procesa pero su respuesta se pierde, conserva la incertidumbre y consulta por esa referencia. Generar otro intento no autoriza otro registro ERP.',
        confirmed: 'Existe evidencia de un intento de integración y una referencia de conciliación.',
        pending: 'Un timeout no demuestra rechazo ni éxito ERP. Falta consultar el resultado externo.',
        route: 'Adaptador de país → ERP · solicitud con referencia estable',
        code: 'erpOperationId = "op-erp-1042"\nerpAttemptId = "attempt-erp-1042-01"\nexternalReference = "POS-CL-1042"\nerpStatus = "reconciliation_required"',
        nodes: [{ state: 'done', status: 'Venta guardada' }, { state: 'done', status: 'Entrega confirmada' }, { state: 'waiting', status: 'Conciliando resultado' }, { state: 'waiting', status: 'Respuesta desconocida' }],
      },
      {
        title: 'La conciliación aporta la confirmación ERP',
        description: 'En este ejemplo, la consulta externa encuentra el registro por su referencia. El adaptador conserva la evidencia, actualiza el estado ERP y publica ese cambio para la sucursal. Si no pudiera comprobarlo, continuaría pendiente de revisión.',
        confirmed: 'El ERP confirmó su registro mediante una consulta verificable.',
        pending: 'Esta confirmación no sustituye los estados propios del pago o del documento fiscal.',
        route: 'ERP → país → sucursal · resultado de conciliación',
        code: 'erpStatus = "confirmed"\nevidence = { erpAttemptId, externalReference, erpDocumentId }\nresultEventId = "evt-erp-1042-confirmed"',
        nodes: [{ state: 'done', status: 'Consulta estados separados' }, { state: 'done', status: 'Resultado ERP recibido' }, { state: 'done', status: 'Evidencia registrada' }, { state: 'done', status: 'Registro comprobado' }],
      },
    ],
  },
  pricing: {
    title: 'Precios locales con una versión completa',
    description: 'Una carga masiva prepara la base y los eventos incorporan cambios. Las cajas siguen leyendo una versión válida mientras la siguiente se comprueba en segundo plano.',
    boundary: 'Pseudocódigo: los IDs y cursores representan un solo flujo comercial ilustrativo. Recibido y preparado no significan activo. La fuente, la vigencia de cotización y el contrato de publicación requieren acuerdo por dato y país; fijar una versión no prolonga su vigencia.',
    nodes: [
      { title: 'Fuente', detail: 'Dueño de precios y ofertas' },
      { title: 'País', detail: 'Publica versiones' },
      { title: 'Candidata', detail: 'Staging en sucursal' },
      { title: 'Activa', detail: 'Lectura local del POS' },
    ],
    steps: [
      {
        title: 'La caja consulta la versión local vigente',
        description: 'La versión 41 está completa, validada y activa. El backend calcula precios y promociones con ese espejo autorizado; registra qué versión aplica a cada operación.',
        confirmed: 'La versión 41 es la versión activa de este ejemplo.',
        pending: 'Una versión futura no puede utilizarse hasta validar su integridad y vigencia.',
        code: 'activePricingVersion = 41\nappliedThrough = 1041\nquote.pricingVersion = 41',
        nodes: [{ state: 'idle', status: 'Fuente autorizada' }, { state: 'idle', status: 'Sin nueva publicación' }, { state: 'idle', status: 'Sin candidata' }, { state: 'done', status: 'Versión 41' }],
      },
      {
        title: 'Una carga masiva crea la candidata',
        description: 'El publicador identifica la candidata 42, una base consistente hasta 1042 y los deltas necesarios hasta el corte objetivo 1045. La sucursal descarga por partes a staging. La carga no modifica los precios activos fila a fila.',
        confirmed: 'La publicación identifica la candidata 42, el corte de su base y la secuencia que debe completar.',
        pending: 'La descarga y la validación de la candidata todavía no terminan.',
        route: 'Fuente → país → staging de sucursal · snapshot 42',
        code: 'candidate = { version: 42, baseWatermark: 1042, targetCursor: 1045 }\nactivePricingVersion = 41\nappliedThrough = 1041',
        nodes: [{ state: 'done', status: 'Snapshot consistente' }, { state: 'done', status: 'Publicación 42' }, { state: 'active', status: 'Descargando candidata' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Se comprueba integridad y alcance',
        description: 'La sucursal verifica checksum, cantidades, moneda, país, referencias y vigencia. Una carga incompleta o incompatible queda rechazada o pendiente; no se convierte en la versión visible para las ventas.',
        confirmed: 'El snapshot 42 pasó las validaciones del ejemplo.',
        pending: 'Falta completar los cambios posteriores al punto de corte antes de activar.',
        code: 'validateChecksum(); validateReferences();\nvalidateScope(); validateValidity();',
        nodes: [{ state: 'done', status: 'Snapshot identificado' }, { state: 'done', status: 'Contrato publicado' }, { state: 'active', status: 'Validando candidata 42' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Los deltas completan la candidata',
        description: 'Los cambios posteriores a la base se guardan y preparan sobre la candidata con identidad estable. El delta en la posición 1043 se incorpora una sola vez. Esto avanza la preparación, no el cursor de la versión activa.',
        confirmed: 'La candidata incorpora los cambios hasta 1043; la versión activa y su cursor siguen intactos.',
        pending: 'La versión 42 permanece oculta hasta completar y validar la secuencia requerida.',
        route: 'País → candidata · delta 1043',
        code: 'persistReceived("delta-1043");\napplyOnceToCandidate("delta-1043", 42);\nreceivedThrough = 1043; // persistido sin huecos\n// appliedThrough sigue en 1041',
        nodes: [{ state: 'done', status: 'Cambio publicado' }, { state: 'active', status: 'Distribuye delta 1043' }, { state: 'active', status: 'Preparada hasta 1043' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'Un hueco bloquea la activación',
        description: 'Llega el cambio 1045, pero falta el 1044. La sucursal detecta el hueco, conserva el pendiente y solicita recuperación. No supone que una versión parcialmente actualizada sea válida.',
        confirmed: 'La versión 41 sigue disponible si su política de vigencia lo permite.',
        pending: 'La candidata no puede activarse: falta el delta 1044 y la validación final.',
        code: 'receivedThrough = 1043\nbufferedSequences = [1045]; missingSequence = 1044\nappliedThrough = 1041\ncandidateStatus = "gap_detected"',
        nodes: [{ state: 'done', status: 'Cambios disponibles' }, { state: 'waiting', status: 'Debe recuperar 1044' }, { state: 'waiting', status: 'Hueco detectado' }, { state: 'done', status: 'Versión 41 intacta' }],
      },
      {
        title: 'La recuperación completa la secuencia',
        description: 'El publicador reenvía el cambio faltante o entrega una nueva base consistente si el histórico ya no está disponible. En este recorrido se recupera 1044, se aplica 1045 y se vuelve a validar la candidata.',
        confirmed: 'La candidata 42 está completa hasta el punto de activación acordado.',
        pending: 'Todavía falta el cambio atómico de la versión activa.',
        route: 'País → candidata · recuperación de 1044 y 1045',
        code: 'applyToCandidateInOrder([1044, 1045]);\nreceivedThrough = 1045; // secuencia completa persistida\nvalidateAndSealCandidate(42, 1045);\n// appliedThrough sigue en 1041',
        nodes: [{ state: 'done', status: 'Histórico recuperable' }, { state: 'done', status: 'Secuencia reenviada' }, { state: 'done', status: 'Candidata 42 completa' }, { state: 'done', status: 'Sigue en versión 41' }],
      },
      {
        title: 'La activación cambia la referencia completa',
        description: 'Con la candidata completa, validada e inmutable, una transacción corta comprueba las precondiciones y confirma inbox aplicada, puntero de versión, cursor aplicado y evidencia. Descarga y validación pesada ya terminaron. Las lecturas ven la versión anterior o la nueva completa.',
        confirmed: 'Versión 42 activa, inbox aplicada y cursor aplicado 1045 quedan confirmados juntos.',
        pending: 'Las cotizaciones anteriores conservan su versión, sujetas a vigencia; el inicio del pago exige revalidación.',
        route: 'Candidata validada → versión activa · cambio atómico',
        code: 'BEGIN;\n  assertActiveVersion(41);\n  assertValidatedCandidate(42, 1045);\n  markInboxAppliedThrough(1045);\n  setActivePricingVersion(42);\n  setAppliedCursor(1045); recordActivation(42);\nCOMMIT;',
        nodes: [{ state: 'done', status: 'Versión identificada' }, { state: 'done', status: 'Distribución registrada' }, { state: 'done', status: 'Candidata validada' }, { state: 'active', status: 'Versión 42 activa' }],
      },
      {
        title: 'Cada operación conserva su versión aplicada',
        description: 'Las nuevas cotizaciones usan 42; una anterior conserva la versión que explica su importe. Antes de pagar se revalida su vigencia. Si la política exige recotizar, el cambio se muestra y confirma antes del cobro. Un pago iniciado o incierto conserva importe, identidad y referencia mientras se resuelve.',
        confirmed: 'La venta conserva versión, precios y reglas efectivamente aplicadas para auditoría.',
        pending: 'El plazo de cotización y las condiciones de recálculo requieren acuerdo comercial y fiscal. La actualización no autoriza modificar un pago en curso.',
        code: 'newQuote.pricingVersion = 42\nif (payment.notStarted) revalidateQuoteBeforePayment();\nsale.appliedPricingVersion = confirmedQuote.version\n// pago iniciado: conservar importe, identidad y referencia',
        nodes: [{ state: 'done', status: 'Autoridad definida' }, { state: 'done', status: 'Versión trazable' }, { state: 'done', status: 'Evidencia conservada' }, { state: 'done', status: 'Nuevas consultas en 42' }],
      },
    ],
  },
};
