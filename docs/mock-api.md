# API de la maqueta y límites de simulación

La interfaz consume `PosStore` de `@corporate-pos/data-access`. No accede a `localStorage`, endpoints empresariales ni dispositivos reales. `@corporate-pos/domain` no depende de Angular. Todos los nombres, correos, RUT, ventas y cuentas iniciales son sintéticos y se identifican como demostración; un RUT con dígito verificador válido no acredita una identidad.

## Estado y comandos

`snapshot()` es un signal de solo lectura con productos, clientes, ventas, ventas en espera, órdenes, turnos, movimientos, cuentas por cobrar, acuerdos, cobranzas, notas de crédito, ofertas, sincronizaciones, outbox, logs, auditoría, dispositivos, módulos, usuarios, sucursales, catálogos auxiliares, integraciones y configuración. El estado publicado está congelado; los formularios deben trabajar sobre copias. Los eventos usan marcas ISO con hora. Los vencimientos de cuotas y depósitos usan la fecha civil `YYYY-MM-DD`, que la UI debe mostrar sin desplazarla de zona horaria. Los importes CLP son enteros.

Los comandos devuelven `Result<T> = {ok: true, value: T} | {ok: false, error: string}`. La interfaz decide cómo presentar el resultado. `runSync`, `retryOutbox`, `retryFiscal`, `testDevice` y `testIntegration` devuelven `Promise<Result<T>>`.

| Área             | Comandos                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso           | `can(permission, module?)`, `isEnabled(module)`, `switchRole(role)`                                                                                                         |
| Venta            | `quote(lines, customerId?, orderReference?)`, `applyOffer(lines, code)`, `checkout(input)`, `holdSale(lines, customerId, documentType, label, metadata?)`, `resumeSale(id)` |
| Borrador activo  | `saveActiveDraft({lines,customerId,documentType,metadata})`, `clearActiveDraft()`; snapshot `activeDraft` recuperable tras navegación o recarga                             |
| Órdenes de venta | `loadSalesOrder(id)`; el cobro valida la referencia estructurada, cliente, bloqueo y estado                                                                                 |
| Caja             | `openSession(amount)`, `closeSession(counted, {kind, reason?})`, `moveCash(type, amount, reason)`                                                                           |
| Documentos       | `printDocument(saleId)`, `retryFiscal(saleId)`, `resolvePayment(saleId, outcome)`                                                                                           |
| Cobranzas        | `collect(receivableId, amount, method)`, `advance(customerId, amount, method)`                                                                                              |
| Acuerdos         | `createAgreement(input)`, `collectInstallment(agreementId, installmentId, amount, method)`                                                                                  |
| Custodia         | `confirmCustodyDeposit(movementId, {bankId, reference, date})`                                                                                                              |
| Devoluciones     | `issueCreditNote(input)`, `quoteCreditNoteRefund(id, method)`, `refundCreditNote(id, method)`; el reembolso requiere la NC fiscalmente emitida                              |
| Maestros         | `saveCustomer(input)`, `createCustomer(input)` rápido sin cupo, `saveProduct(input)`, `saveReferenceItem(kind, item)`                                                       |
| Precios          | `setPrice(productId, price)`, `saveOffer(offer)`, `savePriceRule(rule)`                                                                                                     |
| Plataforma       | `updateSettings(partial)`, `setModule(id, enabled)`, `saveUser(user)`, `saveBranch(branch)`                                                                                 |
| Sincronización   | `updateSyncJob(id, {schedule?, failNext?})`, `runSync(id)`, `retryOutbox(id)`                                                                                               |
| Dispositivos     | `setDevice(id, enabled)`, `updateDevice(id, partial)`, `testDevice(id)`                                                                                                     |
| Integraciones    | `setIntegration(id, enabled)`, `updateIntegration(id, partial)`, `testIntegration(id)`                                                                                      |
| Versiones        | `checkUpdate()`, `downloadUpdate()`, `applyUpdate()`                                                                                                                        |
| Demostración     | `setOnline(boolean)`, `setTheme(theme)`, `resetDemo()`                                                                                                                      |

El cambio de perfil y conectividad son controles de la demostración, no autenticación. La sesión inicial está abierta con fondo y seis ventas de muestra. El permiso y el módulo se verifican otra vez al ejecutar cada comando; ocultar un botón no constituye autorización. Las tareas programadas tienen un camino interno propio, sin permitir que la interfaz omita el control del disparo manual.

## Dinero y estados

- Los precios incluyen IVA de 19 %. Se redondea el descuento de cada línea a pesos; el neto es `round(total / 1.19)` y el impuesto es `total - neto`.
- El total de medios de pago debe coincidir con el importe a cobrar. El total tributario y su IVA se conservan; el redondeo se guarda aparte en `roundingAdjustment` y `paidTotal`. La porción en efectivo usa la regla chilena: 1–5 baja a la decena anterior y 6–9 sube. La interfaz envía el efectivo neto de cobro y `cashTendered` por separado.
- Efectivo, débito, crédito, transferencia, cheque validado por Orsan simulado, crédito de cliente, saldo de nota de crédito, anticipo y USD son medios diferentes. USD exige monto original y tipo de cambio explícitos; no se suma al arqueo físico CLP.
- Aplicar un anticipo en venta u orden consume el saldo disponible del mismo cliente. El ingreso original permanece en la cobranza; la aplicación no recibe efectivo de nuevo. La maqueta no incluye devolución de anticipos no aplicados.
- Una venta tiene estado de pago, emisión fiscal y entrega al ERP por separado. Guardar localmente deja eventos pendientes. Ninguna simulación contacta al SII, consume folios, llama al ERP o ejecuta cobros reales.
- Un pago de tarjeta de resultado desconocido exige conciliación explícita de un supervisor o administrador. No se vuelve a cobrar y no se envían sus eventos fiscal/ERP hasta confirmar el pago. Este escenario de demostración se limita a una sola tarjeta por venta.
- La misma clave de idempotencia con el mismo contenido recupera la venta existente. Cambiar los productos o pagos y reutilizar la clave produce un error.
- La nota de crédito y el reembolso son operaciones separadas. El comando de reembolso exige emisión fiscal confirmada; las notas pendientes o fallidas no permiten devolver dinero. El saldo de una nota puede aplicarse a otra venta o reembolsarse una vez. Una devolución parcial nunca supera las unidades o el importe originales.
- La liquidación de una NC compensa primero la deuda pendiente de su venta, reduciendo cupo usado y cuotas. Solo el remanente financiado por pagos o cobranzas puede devolverse en dinero. `debtOffsetAmount` y `refundPaymentAmount` conservan el desglose; `refundedAmount` es el importe nominal ya saldado. El redondeo de la venta original se distribuye entre devoluciones y nunca permite devolver más valor que el recibido. El preview y el comando usan la misma función del dominio. Compensar deuda requiere conexión simulada.
- Para usar una NC como pago, `quoteCreditNoteApplication(id, customerId)` entrega `availableAmount` y `debtOffsetAmount`: reserva primero la deuda de origen y limita el saldo utilizable a financiación real. Confirmar la nueva venta compensa esa deuda y consume únicamente el remanente en una sola mutación. Una NC de una venta íntegramente impaga no puede convertirse en efectivo encadenando otra venta y devolución. Si el reembolso detecta una diferencia de financiación superior al redondeo original, conserva la NC sin liquidar y exige revisión.
- El arqueo parcial guarda conteo y diferencia, manteniendo el turno abierto. Es una decisión nueva de producto; no representa el cierre parcial del legado. El cierre completo bloquea el turno, exige motivo de diferencias y pagos inciertos resueltos.
- El relevo (`kind: 'handover'`) cierra el turno y libera la caja para una nueva apertura. La custodia reduce el efectivo al retirarlo; confirmar luego el depósito bancario solo documenta su destino, sin descontarlo otra vez.
- Los acuerdos distribuyen saldos existentes en cuotas con fecha e intervalo. No crean otra cuenta por cobrar. Un abono directo o por cuota reduce el mismo saldo y actualiza el acuerdo. Un documento no puede estar en dos acuerdos activos.
- Una orden de venta bloqueada conserva cliente, productos, cantidades y descuentos. Queda reservada ante un pago incierto y pagada al confirmar; un resultado fallido la vuelve a liberar. El ejemplo no consulta órdenes reales del ERP.
- El inventario es consultivo. La maqueta no descuenta stock ni se declara autoridad de existencias.
- El borrador activo guarda exclusivamente líneas, cliente, tipo de documento y datos comerciales de entrega/cupón. No guarda partidas de pago ni datos de tarjeta, voucher o cheque. Confirmar una venta o pausarla elimina el borrador en la misma mutación persistida; reanudar instala el borrador al retirar la pausa. El guardado incremental no llena la auditoría con cada edición del formulario.

Sin conexión se permite únicamente efectivo con maestros locales y límite configurable. El permiso offline no habilita tarjetas, cheque, USD, crédito cliente ni canje de NC. La emisión fiscal y el ERP quedan pendientes. Esto es una política ilustrativa, pendiente de validación comercial/fiscal antes de construir el producto real.

## Sincronización y persistencia

El motor asíncrono está separado en `sync-engine.ts`; recibe un puerto de estado y uno de simulación. La fachada `PosStore` publica signals y controla permisos, persistencia y auditoría. Las reglas de dinero, operaciones y administración viven en archivos independientes y tienen pruebas directas.

Cada trabajo admite ejecución manual y una programación deshabilitada, por intervalo o diaria, con días de semana y zona `America/Santiago`. El cálculo usa fechas UTC y la zona IANA para respetar el cambio de horario. Un reloj local revisa vencimientos cada 20 segundos **solo mientras la aplicación está abierta**. Al abrir tras una interrupción se ejecuta, como máximo, una recuperación por tarea vencida; no se simula trabajo ocurrido con la aplicación cerrada. Una tarea no se solapa consigo misma.

Una hora diaria repetida por el cambio de horario se ejecuta solo en su primera ocurrencia del día local. Si falla el guardado de progreso o finalización, el motor conserva una recuperación pendiente: cuando vuelve el almacenamiento, el siguiente tick o reintento persiste el estado fallido y permite reintentar. No publica un estado no guardado ni deja una promesa terminada bloqueando la tarea indefinidamente. Un reinicio que no consigue persistirse no cancela operaciones válidas en curso.

Los trabajos ERP de ventas, notas de crédito y cobranzas procesan únicamente su familia de eventos. El fiscal atiende su destino independiente. Un fallo simulado consume `failNext`; el siguiente intento usa los mismos identificadores. Una tarea de entrada actualiza la fecha de la copia local y cuenta los registros; no descarga información real ni revierte las ediciones del usuario.

La outbox tiene identidad, destino, intentos y fecha de entrega. Reenviar un evento entregado no produce otro efecto. Los eventos en procesamiento y trabajos activos al recargar se recuperan como fallidos reintentables. Reiniciar la demostración invalida las respuestas asíncronas que estaban en curso, incluidas las pruebas de dispositivos e integraciones. La auditoría conserva el actor y rol que iniciaron una operación asíncrona; las ejecuciones programadas usan el actor «Planificador local» con rol `system`.

La clave local es `corporate-pos:demo:v1`. El adaptador valida la forma del JSON antes de usarlo. Una versión incompatible o datos corruptos recuperan las fixtures y dejan una advertencia. Un fallo al guardar por cuota o bloqueo impide publicar el nuevo estado y se expone en `persistenceError()`.

La evolución aditiva del formato v1 incorpora el borrador y el desglose de NC sin borrar operaciones anteriores: snapshots sin borrador reciben `null`; una liquidación histórica marcada como compensación de cuenta se interpreta como deuda compensada y los otros reembolsos como dinero devuelto.

`POS_REPOSITORY` y `POS_SIMULATION` son puertos inyectables. La futura implementación puede sustituirlos por un repositorio transaccional, reloj, transporte HTTP y puente Tauri. El guardado actual es una instantánea en el almacenamiento de este perfil del navegador: no tiene bloqueo entre pestañas, cifrado, autenticación ni garantía transaccional entre equipos. Para probar de forma determinista, usar una pestaña de operación por perfil.

## Antes de producción

La regla de redondeo toma como referencia al [Banco Central de Chile](https://www.billetesymonedas.cl/Monedas/ReglaRedondeo) y el [Decreto 1266, que contempla el pago parcial en efectivo](https://www.bcn.cl/leychile/navegar?idNorma=1111243). En la maqueta, asignar el vuelto a un anticipo crea el anticipo y la venta en una sola transacción local; si el cliente o el módulo de cobranzas no lo permite, no se guarda ninguno.

Los precios por cliente y escala usan primero el convenio del cliente y después la mayor cantidad mínima aplicable. No acumulan otro descuento sobre ese precio. Las condiciones se desactivan individualmente: ocultar el módulo que las administra no modifica los contratos vigentes. Una orden bloqueada conserva los precios unitarios importados. El crédito usa las condiciones preasignadas al cliente; si tiene más de una cuota se genera un plan sobre la misma deuda, sin duplicarla.

El mecanismo de identidad debe sustituirse por sesión autenticada y permisos del servidor. Los cobros requieren protocolos reales de consulta/conciliación, los DTE un proveedor certificado, la outbox una base transaccional y consumidores idempotentes, y las actualizaciones paquetes firmados. Probar las reglas de crédito, USD, devoluciones y emisión sin conexión con negocio y especialistas tributarios. Las versiones, integraciones e impresiones actuales solo modifican y muestran datos mock.
