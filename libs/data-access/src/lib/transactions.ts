import {
  Agreement,
  AgreementInput,
  CashMovement,
  CartLine,
  CheckoutInput,
  Collection,
  CreditNote,
  PaymentMethod,
  PosSnapshot,
  Result,
  ReturnInput,
  Sale,
  SaleTotals,
  addCalendarDays,
  calculateTotals,
  failure,
  isValidRut,
  priceCart,
  roundCash,
  success,
  toLocalDate,
  validMoney,
} from '@corporate-pos/domain';

export interface TransactionContext {
  now: string;
  id(prefix: string): string;
  actor: string;
}
export const moduleEnabled = (state: PosSnapshot, id: string): boolean =>
  state.modules.some((module) => module.id === id && module.enabled);
export function quoteTransaction(
  state: PosSnapshot,
  lines: readonly CartLine[],
  customerId: string | null = null,
  orderReference?: string,
): Result<SaleTotals> {
  const order = orderReference
    ? state.salesOrders.find((item) => item.number === orderReference || item.id === orderReference)
    : null;
  if (orderReference && !order) return failure('La orden de venta no existe.');
  if (order?.locked) {
    const products = state.products.map((product) => {
      const line = order.lines.find((item) => item.productId === product.id);
      return line ? { ...product, price: line.unitPrice } : product;
    });
    return calculateTotals(lines, products);
  }
  return priceCart(lines, state.products, state.priceRules, customerId);
}
function reduceAgreementBalance(state: PosSnapshot, receivableId: string, amount: number): void {
  for (const agreement of state.agreements.filter(
    (item) => item.status === 'active' && item.receivableIds.includes(receivableId),
  )) {
    let remaining = amount;
    for (const installment of agreement.installments) {
      const applied = Math.min(remaining, installment.balance);
      installment.balance -= applied;
      remaining -= applied;
    }
    if (agreement.installments.every((installment) => installment.balance === 0)) agreement.status = 'paid';
  }
}
export function cashMovement(
  state: PosSnapshot,
  context: TransactionContext,
  type: CashMovement['type'],
  amount: number,
  reason: string,
  reference = '',
): Result<CashMovement> {
  const session = state.session;
  if (!session || session.status !== 'open') return failure('Abre un turno de caja antes de continuar.');
  if (!validMoney(amount)) return failure('Ingresa un importe entero mayor a cero.');
  const outgoing = ['expense', 'custody', 'refund'].includes(type);
  if (outgoing && amount > session.expectedAmount)
    return failure('No hay suficiente efectivo disponible en la caja.');
  const movement: CashMovement = {
    id: context.id('cash'),
    sessionId: session.id,
    type,
    amount,
    reason,
    reference,
    createdAt: context.now,
    actor: context.actor,
  };
  state.cashMovements.unshift(movement);
  session.expectedAmount += outgoing ? -amount : amount;
  return success(movement);
}
export function enqueue(
  state: PosSnapshot,
  context: TransactionContext,
  aggregateId: string,
  type: 'sale.created' | 'credit-note.created' | 'collection.created',
  target: 'erp' | 'fiscal',
): void {
  if (
    state.outbox.some(
      (event) => event.aggregateId === aggregateId && event.type === type && event.target === target,
    )
  )
    return;
  state.outbox.unshift({
    id: context.id('evt'),
    aggregateId,
    type,
    target,
    status: 'pending',
    attempts: 0,
    createdAt: context.now,
    deliveredAt: null,
    lastError: null,
  });
}
export function validatePayment(state: PosSnapshot, method: PaymentMethod): Result<void> {
  if (
    ![
      'efectivo',
      'debito',
      'credito',
      'transferencia',
      'cheque',
      'cuenta',
      'nota_credito',
      'usd',
      'anticipo',
    ].includes(method)
  )
    return failure('El medio de pago no es válido.');
  if (method === 'efectivo' && !moduleEnabled(state, 'cashPayment'))
    return failure('El pago en efectivo está deshabilitado.');
  if (method === 'cheque' && !moduleEnabled(state, 'chequePayment'))
    return failure('El pago con cheque está deshabilitado.');
  if (method === 'cuenta' && !moduleEnabled(state, 'creditPayment'))
    return failure('El crédito cliente está deshabilitado.');
  if (method === 'nota_credito' && !moduleEnabled(state, 'creditNotePayment'))
    return failure('El pago con nota de crédito está deshabilitado.');
  if (method === 'usd' && !moduleEnabled(state, 'usdPayment'))
    return failure('El pago en dólares está deshabilitado.');
  if (method === 'anticipo' && !moduleEnabled(state, 'advancePayment'))
    return failure('La aplicación de anticipos está deshabilitada.');
  if (!state.online && method !== 'efectivo')
    return failure('Sin conexión, esta demostración solo permite efectivo.');
  const integrationKind =
    method === 'debito' || method === 'credito' ? 'payments' : method === 'cheque' ? 'cheques' : null;
  if (
    integrationKind &&
    !state.integrations.some(
      (item) => item.kind === integrationKind && item.enabled && item.status === 'connected',
    )
  )
    return failure('La integración de este medio de pago no está disponible.');
  if (
    integrationKind === 'payments' &&
    !state.devices.some((device) => device.type === 'payment' && device.enabled && device.status === 'ready')
  )
    return failure('El terminal de pago no está disponible.');
  return success(undefined);
}
function equalRequest(sale: Sale, input: CheckoutInput): boolean {
  const lines = input.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    discount: line.discount,
  }));
  const oldLines = sale.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    discount: line.discount,
  }));
  const canonical = (record: object): string =>
    JSON.stringify(
      Object.entries(record)
        .filter(([, value]) => value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  return (
    JSON.stringify(lines) === JSON.stringify(oldLines) &&
    (input.customerId || null) === sale.customerId &&
    input.documentType === sale.documentType &&
    (input.cashTendered ??
      input.payments
        .filter((payment) => payment.method === 'efectivo')
        .reduce((sum, payment) => sum + payment.amount, 0)) === sale.cashTendered &&
    (input.changeDisposition ?? 'cash') === sale.changeDisposition &&
    canonical(input.metadata ?? {}) === canonical(sale.metadata) &&
    JSON.stringify(
      input.payments.map((payment) => [
        payment.method,
        payment.amount,
        payment.reference ?? '',
        canonical(payment.details ?? {}),
      ]),
    ) ===
      JSON.stringify(
        sale.payments.map((payment) => [
          payment.method,
          payment.amount,
          payment.reference,
          canonical(payment.details ?? {}),
        ]),
      )
  );
}
export function checkoutTransaction(
  state: PosSnapshot,
  input: CheckoutInput,
  context: TransactionContext,
): Result<Sale> {
  if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 200)
    return failure('La operación necesita un identificador válido.');
  const existing = state.sales.find((sale) => sale.idempotencyKey === input.idempotencyKey);
  if (existing)
    return equalRequest(existing, input)
      ? success(existing)
      : failure('Ese identificador ya se utilizó con otra operación.');
  const session = state.session;
  if (!session || session.status !== 'open') return failure('Abre un turno de caja antes de vender.');
  if (session.branchId !== state.settings.branchId)
    return failure('El turno abierto pertenece a otra sucursal.');
  if (!['boleta', 'factura'].includes(input.documentType)) return failure('Selecciona boleta o factura.');
  const customer = input.customerId
    ? state.customers.find((item) => item.id === input.customerId && item.active)
    : null;
  if (input.customerId && !customer) return failure('El cliente no está disponible.');
  if (
    input.documentType === 'factura' &&
    (!customer || !customer.business.trim() || !customer.address.trim())
  )
    return failure('La factura requiere un cliente con giro y dirección.');
  const order = input.metadata?.orderReference?.trim()
    ? state.salesOrders.find(
        (item) =>
          item.number === input.metadata?.orderReference || item.id === input.metadata?.orderReference,
      )
    : null;
  if (input.metadata?.orderReference?.trim() && !order)
    return failure('La orden de venta no existe. Selecciónala desde las órdenes disponibles.');
  if (order) {
    if (order.status !== 'open')
      return failure('La orden ya está pagada o tiene un pago pendiente de conciliar.');
    if (order.customerId !== customer?.id) return failure('La venta debe conservar el cliente de la orden.');
    const signature = (lines: typeof input.lines): string =>
      JSON.stringify(
        lines
          .map((line) => [line.productId, line.quantity, line.discount])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      );
    if (order.locked && signature(order.lines) !== signature(input.lines))
      return failure('Esta orden está bloqueada: conserva productos, cantidades y descuentos.');
  }
  const quote = quoteTransaction(state, input.lines, customer?.id ?? null, input.metadata?.orderReference);
  if (!quote.ok) return quote;
  if (!quote.value.total) return failure('El total de la venta debe ser mayor a cero.');
  if (input.lines.some((line) => line.discount > 0) && !moduleEnabled(state, 'discounts'))
    return failure('Los descuentos están deshabilitados.');
  if (input.lines.some((line) => line.discount > state.settings.maxDiscountPercent))
    return failure(`El descuento máximo permitido es ${state.settings.maxDiscountPercent} %.`);
  if (input.metadata?.coupon?.trim()) {
    const code = input.metadata.coupon.trim().toLowerCase(),
      now = Date.parse(context.now);
    const offer = state.offers.find(
      (item) =>
        (item.id.toLowerCase() === code || item.name.toLowerCase() === code) &&
        item.active &&
        Date.parse(item.startsAt) <= now &&
        Date.parse(item.endsAt) >= now,
    );
    if (
      !offer ||
      !input.lines.some((line) => offer.productIds.includes(line.productId)) ||
      input.lines.some(
        (line) => offer.productIds.includes(line.productId) && line.discount < offer.discountPercent,
      )
    )
      return failure('Aplica un código de oferta vigente a los productos antes de cobrar.');
  }
  if (
    !state.online &&
    (!moduleEnabled(state, 'offlineSales') || quote.value.total > state.settings.offlineLimit)
  )
    return failure('La venta excede la política de operación sin conexión.');
  if (input.payments.length > 1 && !moduleEnabled(state, 'splitPayment'))
    return failure('Los pagos combinados están deshabilitados.');
  if (
    !input.payments.length ||
    input.payments.length > 6 ||
    input.payments.some((payment) => !validMoney(payment.amount, payment.method === 'efectivo'))
  )
    return failure('Completa los importes de los medios de pago.');
  const hasCash = input.payments.some((payment) => payment.method === 'efectivo');
  const nonCash = input.payments
    .filter((payment) => payment.method !== 'efectivo')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const cashPaid = input.payments
    .filter((payment) => payment.method === 'efectivo')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const paidTotal = hasCash ? nonCash + roundCash(quote.value.total - nonCash) : quote.value.total;
  if (
    nonCash > quote.value.total ||
    input.payments.reduce((sum, payment) => sum + payment.amount, 0) !== paidTotal
  )
    return failure(
      'La suma de pagos debe coincidir con el total a cobrar, incluido el redondeo del saldo en efectivo.',
    );
  const cashTendered = input.cashTendered ?? cashPaid;
  if (!validMoney(cashTendered, true) || cashTendered < cashPaid || (!hasCash && cashTendered > 0))
    return failure('El efectivo recibido no cubre el importe de efectivo a cobrar.');
  const change = cashTendered - cashPaid,
    changeDisposition = input.changeDisposition ?? 'cash';
  if (!['cash', 'advance'].includes(changeDisposition)) return failure('Selecciona el destino del vuelto.');
  if (changeDisposition === 'advance' && (!customer || !moduleEnabled(state, 'collections')))
    return failure('El vuelto como anticipo requiere un cliente y el módulo de cobranzas habilitado.');
  for (const payment of input.payments) {
    const valid = validatePayment(state, payment.method);
    if (!valid.ok) return valid;
    if (['transferencia', 'cheque'].includes(payment.method) && !payment.reference?.trim())
      return failure('La transferencia o el cheque necesita una referencia.');
    if (payment.method === 'cheque') {
      const details = payment.details;
      if (
        !details?.bankId ||
        !state.referenceCatalogs.bank.some((item) => item.id === details.bankId && item.active) ||
        !details.plazaId ||
        !state.referenceCatalogs.plaza.some((item) => item.id === details.plazaId && item.active) ||
        !details.chequeNumber?.trim() ||
        !details.accountNumber?.trim() ||
        !details.dueAt ||
        !toLocalDate(details.dueAt) ||
        !details.issuerName?.trim() ||
        !details.issuerRut ||
        !isValidRut(details.issuerRut) ||
        !details.holderName?.trim() ||
        !details.holderRut ||
        !isValidRut(details.holderRut)
      )
        return failure(
          'El cheque necesita banco, plaza, número, cuenta, vencimiento y nombre/RUT válido de emisor y portador.',
        );
    }
    if (payment.method === 'usd') {
      const amount = payment.details?.currencyAmount,
        rate = payment.details?.exchangeRate;
      if (
        amount === undefined ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001 ||
        rate === undefined ||
        !validMoney(rate) ||
        Math.round(amount * rate) !== payment.amount
      )
        return failure(
          'Ingresa dólares (hasta dos decimales) y tipo de cambio; el equivalente CLP debe coincidir.',
        );
    }
    if (payment.method === 'nota_credito') {
      const note = state.creditNotes.find((item) => item.id === payment.reference);
      const originalSale = state.sales.find((item) => item.id === note?.saleId);
      const requested = input.payments
        .filter((item) => item.method === 'nota_credito' && item.reference === payment.reference)
        .reduce((sum, item) => sum + item.amount, 0);
      if (
        !note ||
        note.fiscalStatus !== 'issued' ||
        note.amount - note.refundedAmount - note.appliedAmount < requested
      )
        return failure('La nota de crédito no está emitida o no tiene saldo suficiente.');
      if (originalSale?.customerId && originalSale.customerId !== customer?.id)
        return failure('La nota de crédito pertenece a otro cliente.');
    }
    if (payment.method === 'anticipo') {
      const advance = state.collections.find(
        (item) => item.id === payment.reference && item.kind === 'advance',
      );
      const requested = input.payments
        .filter((item) => item.method === 'anticipo' && item.reference === payment.reference)
        .reduce((sum, item) => sum + item.amount, 0);
      if (
        !advance ||
        advance.customerId !== customer?.id ||
        advance.amount - advance.appliedAmount < requested
      )
        return failure('El anticipo no pertenece al cliente o no tiene saldo suficiente.');
    }
  }
  const creditAmount = input.payments
    .filter((payment) => payment.method === 'cuenta')
    .reduce((sum, payment) => sum + payment.amount, 0);
  if (creditAmount && (!customer || customer.creditLimit - customer.creditUsed < creditAmount))
    return failure('Selecciona un cliente con cupo suficiente.');
  if (input.metadata?.deliveryMode === 'delivery' && !input.metadata.deliveryAddress?.trim())
    return failure('Ingresa la dirección de despacho.');
  const cardPayments = input.payments.some((payment) => ['debito', 'credito'].includes(payment.method));
  if (input.paymentScenario && input.paymentScenario !== 'confirmed' && !cardPayments)
    return failure('El escenario de pago solo corresponde a tarjetas.');
  if (input.paymentScenario === 'failed')
    return failure('El terminal simulado rechazó el pago. No se guardó la venta ni se generó un cobro.');
  const unknown = input.paymentScenario === 'unknown';
  if (unknown && input.payments.length !== 1)
    return failure('La simulación de resultado desconocido admite un único pago con tarjeta.');
  const sale: Sale = {
    id: context.id('sale'),
    number: `${input.documentType === 'boleta' ? 'B' : 'F'}-DEMO-${10001 + state.sales.length}`,
    createdAt: context.now,
    customerId: customer?.id ?? null,
    customerName: customer?.name ?? 'Consumidor final',
    documentType: input.documentType,
    ...quote.value,
    paidTotal,
    roundingAdjustment: paidTotal - quote.value.total,
    cashTendered,
    change,
    changeDisposition,
    changeAdvanceId: null,
    payments: input.payments.map((payment) => ({
      id: context.id('pay'),
      ...payment,
      reference: payment.reference ?? '',
      status: unknown && ['debito', 'credito'].includes(payment.method) ? 'unknown' : 'confirmed',
    })),
    paymentStatus: unknown ? 'unknown' : 'confirmed',
    fiscalStatus: 'pending',
    erpStatus: 'pending',
    status: 'completed',
    branchId: state.settings.branchId,
    cashier: context.actor,
    sessionId: session.id,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata ?? {},
  };
  state.sales.unshift(sale);
  if (order) {
    order.status = unknown ? 'in_payment' : 'paid';
    order.saleId = sale.id;
  }
  for (const payment of sale.payments.filter((item) => item.method === 'nota_credito')) {
    const note = state.creditNotes.find((item) => item.id === payment.reference);
    if (note) note.appliedAmount += payment.amount;
  }
  for (const payment of sale.payments.filter((item) => item.method === 'anticipo')) {
    const advance = state.collections.find((item) => item.id === payment.reference);
    if (advance) advance.appliedAmount += payment.amount;
  }
  for (const payment of sale.payments.filter((item) => item.method === 'efectivo' && item.amount > 0))
    cashMovement(state, context, 'sale', payment.amount, `Venta ${sale.number}`, sale.id);
  if (change > 0 && changeDisposition === 'advance' && customer) {
    const advance = collectTransaction(state, context, customer.id, null, change, 'efectivo');
    if (!advance.ok) return advance;
    sale.changeAdvanceId = advance.value.id;
  }
  if (creditAmount && customer) {
    customer.creditUsed += creditAmount;
    const debtId = context.id('debt');
    const dueAt = addCalendarDays(
      toLocalDate(context.now) ?? context.now.slice(0, 10),
      customer.creditTerms.periodDays,
    );
    state.receivables.unshift({
      id: debtId,
      customerId: customer.id,
      document: sale.number,
      issuedAt: context.now,
      dueAt,
      amount: creditAmount,
      balance: creditAmount,
      status: 'pending',
    });
    if (customer.creditTerms.installments > 1) {
      const plan = createAgreementTransaction(
        state,
        {
          customerId: customer.id,
          receivableIds: [debtId],
          installments: customer.creditTerms.installments,
          startDate: dueAt,
          periodDays: customer.creditTerms.periodDays,
        },
        context,
      );
      if (!plan.ok) return plan;
    }
  }
  enqueue(state, context, sale.id, 'sale.created', 'erp');
  enqueue(state, context, sale.id, 'sale.created', 'fiscal');
  return success(sale);
}
export function collectTransaction(
  state: PosSnapshot,
  context: TransactionContext,
  customerId: string,
  receivableId: string | null,
  amount: number,
  method: PaymentMethod,
): Result<Collection> {
  if (!state.session || state.session.status !== 'open') return failure('Abre un turno para recibir pagos.');
  const customer = state.customers.find((item) => item.id === customerId && item.active);
  if (!customer) return failure('Selecciona un cliente activo.');
  if (!validMoney(amount)) return failure('El importe debe ser un entero mayor a cero.');
  if (['cuenta', 'nota_credito', 'usd', 'cheque', 'anticipo'].includes(method))
    return failure('Las cobranzas de esta maqueta admiten efectivo, débito, crédito o transferencia.');
  const valid = validatePayment(state, method);
  if (!valid.ok) return valid;
  const debt = receivableId
    ? state.receivables.find((item) => item.id === receivableId && item.customerId === customerId)
    : null;
  if (receivableId && (!debt || amount > debt.balance))
    return failure('El abono excede el saldo pendiente o el documento no existe.');
  if (debt) {
    debt.balance -= amount;
    debt.status = debt.balance === 0 ? 'paid' : 'partial';
    customer.creditUsed = Math.max(0, customer.creditUsed - amount);
    reduceAgreementBalance(state, debt.id, amount);
  }
  const collection: Collection = {
    id: context.id('collection'),
    customerId,
    receivableId,
    amount,
    method,
    kind: receivableId ? 'collection' : 'advance',
    appliedAmount: 0,
    createdAt: context.now,
    reference: context.id('receipt'),
    branchId: state.settings.branchId,
    sessionId: state.session.id,
  };
  state.collections.unshift(collection);
  if (method === 'efectivo')
    cashMovement(
      state,
      context,
      collection.kind,
      amount,
      `${receivableId ? 'Abono' : 'Anticipo'} de ${customer.name}`,
      collection.id,
    );
  enqueue(state, context, collection.id, 'collection.created', 'erp');
  return success(collection);
}
export function issueCreditNoteTransaction(
  state: PosSnapshot,
  input: ReturnInput,
  context: TransactionContext,
): Result<CreditNote> {
  const sale = state.sales.find((item) => item.id === input.saleId);
  if (!sale) return failure('La venta no existe.');
  if (sale.paymentStatus !== 'confirmed') return failure('Aclara el resultado del pago antes de devolver.');
  if (sale.fiscalStatus !== 'issued')
    return failure('La venta necesita un documento fiscal emitido antes de generar una nota de crédito.');
  if (!input.reason.trim() || input.reason.trim().length < 8)
    return failure('Describe el motivo de la devolución con al menos ocho caracteres.');
  if (!Object.keys(input.quantities).length) return failure('Selecciona productos y cantidades a devolver.');
  let amount = 0;
  const quantities: Record<string, number> = {};
  for (const [productId, quantity] of Object.entries(input.quantities)) {
    if (quantity === 0) continue;
    const line = sale.lines.find((item) => item.productId === productId);
    const alreadyReturned = state.creditNotes
      .filter((note) => note.saleId === sale.id)
      .reduce((sum, note) => sum + (note.lineQuantities[productId] ?? 0), 0);
    if (!line || !validMoney(quantity) || quantity + alreadyReturned > line.quantity)
      return failure('La cantidad a devolver excede las unidades disponibles.');
    // Cumulative allocation prevents a one-peso drift over repeated partial returns.
    amount +=
      Math.round((line.total * (alreadyReturned + quantity)) / line.quantity) -
      Math.round((line.total * alreadyReturned) / line.quantity);
    quantities[productId] = quantity;
  }
  if (!Object.keys(quantities).length) return failure('Selecciona al menos una unidad a devolver.');
  if (!amount)
    return failure('El importe de estas unidades se redondea a cero. Agrupa más unidades en la devolución.');
  const note: CreditNote = {
    id: context.id('nc'),
    number: `NC-DEMO-${1001 + state.creditNotes.length}`,
    saleId: sale.id,
    amount,
    reason: input.reason.trim(),
    lineQuantities: quantities,
    createdAt: context.now,
    fiscalStatus: 'pending',
    refundMethod: input.refundMethod,
    refundedAmount: 0,
    refundedAt: null,
    appliedAmount: 0,
  };
  state.creditNotes.unshift(note);
  const allReturned = sale.lines.every(
    (line) =>
      state.creditNotes
        .filter((item) => item.saleId === sale.id)
        .reduce((sum, item) => sum + (item.lineQuantities[line.productId] ?? 0), 0) === line.quantity,
  );
  sale.status = allReturned ? 'returned' : 'partially_returned';
  enqueue(state, context, note.id, 'credit-note.created', 'fiscal');
  enqueue(state, context, note.id, 'credit-note.created', 'erp');
  return success(note);
}
export function refundCreditNoteTransaction(
  state: PosSnapshot,
  id: string,
  method: PaymentMethod,
  context: TransactionContext,
): Result<CreditNote> {
  const note = state.creditNotes.find((item) => item.id === id);
  if (!note) return failure('La nota de crédito no existe.');
  if (note.fiscalStatus !== 'issued')
    return failure('Emite la nota de crédito antes de registrar el reembolso.');
  const remaining = note.amount - note.refundedAmount - note.appliedAmount;
  if (remaining <= 0) return failure('Esta nota de crédito no tiene saldo disponible.');
  const valid = validatePayment(state, method);
  if (!valid.ok) return valid;
  if (!state.session || state.session.status !== 'open')
    return failure('Abre un turno antes de registrar el reembolso.');
  if (['cheque', 'usd', 'nota_credito', 'anticipo'].includes(method))
    return failure('El reembolso admite efectivo, tarjeta, transferencia o compensación de deuda.');
  if (method === 'efectivo') {
    const movement = cashMovement(state, context, 'refund', remaining, `Reembolso ${note.number}`, note.id);
    if (!movement.ok) return movement;
  }
  if (method === 'cuenta') {
    const sale = state.sales.find((item) => item.id === note.saleId);
    const debt = state.receivables.find((item) => item.document === sale?.number);
    if (!debt || debt.balance < remaining)
      return failure('El documento no tiene saldo suficiente para compensar contra crédito.');
    debt.balance -= remaining;
    debt.status = debt.balance ? 'partial' : 'paid';
    reduceAgreementBalance(state, debt.id, remaining);
    const customer = state.customers.find((item) => item.id === debt.customerId);
    if (customer) customer.creditUsed = Math.max(0, customer.creditUsed - remaining);
  }
  note.refundMethod = method;
  note.refundedAmount += remaining;
  note.refundedAt = context.now;
  return success(note);
}

export function createAgreementTransaction(
  state: PosSnapshot,
  input: AgreementInput,
  context: TransactionContext,
): Result<Agreement> {
  if (!state.customers.some((customer) => customer.id === input.customerId && customer.active))
    return failure('Selecciona un cliente activo.');
  if (!input.receivableIds.length || new Set(input.receivableIds).size !== input.receivableIds.length)
    return failure('Selecciona documentos distintos para el acuerdo.');
  const startDate = toLocalDate(input.startDate);
  if (
    !Number.isInteger(input.installments) ||
    input.installments < 1 ||
    input.installments > 36 ||
    !Number.isInteger(input.periodDays) ||
    input.periodDays < 1 ||
    input.periodDays > 365 ||
    !startDate
  )
    return failure('Configura entre 1 y 36 cuotas, una fecha y un intervalo entre 1 y 365 días.');
  let total = 0;
  for (const id of input.receivableIds) {
    const debt = state.receivables.find(
      (item) => item.id === id && item.customerId === input.customerId && item.balance > 0,
    );
    if (!debt) return failure('Un documento no pertenece al cliente o ya no tiene saldo.');
    if (
      state.agreements.some(
        (agreement) => agreement.status === 'active' && agreement.receivableIds.includes(id),
      )
    )
      return failure('Uno de los documentos ya tiene un acuerdo activo.');
    total += debt.balance;
  }
  if (!validMoney(total) || total < input.installments)
    return failure('El saldo es insuficiente para ese número de cuotas.');
  const base = Math.floor(total / input.installments),
    remainder = total % input.installments;
  const agreement: Agreement = {
    id: context.id('agreement'),
    customerId: input.customerId,
    receivableIds: [...input.receivableIds],
    createdAt: context.now,
    status: 'active',
    installments: Array.from({ length: input.installments }, (_, index) => {
      const amount = base + (index < remainder ? 1 : 0);
      return {
        id: context.id('installment'),
        number: index + 1,
        dueAt: addCalendarDays(startDate, index * input.periodDays),
        amount,
        balance: amount,
      };
    }),
  };
  state.agreements.unshift(agreement);
  return success(agreement);
}
export function collectInstallmentTransaction(
  state: PosSnapshot,
  agreementId: string,
  installmentId: string,
  amount: number,
  method: PaymentMethod,
  context: TransactionContext,
): Result<Collection[]> {
  const agreement = state.agreements.find((item) => item.id === agreementId && item.status === 'active');
  const installment = agreement?.installments.find((item) => item.id === installmentId);
  if (!agreement || !installment || !validMoney(amount) || amount > installment.balance)
    return failure('La cuota no existe o el importe excede el saldo.');
  if (agreement.installments.find((item) => item.balance > 0)?.id !== installmentId)
    return failure('Abona primero la cuota pendiente más antigua.');
  const collections: Collection[] = [];
  let remaining = amount;
  for (const debt of state.receivables
    .filter((item) => agreement.receivableIds.includes(item.id) && item.balance > 0)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))) {
    if (!remaining) break;
    const allocated = Math.min(debt.balance, remaining);
    const collected = collectTransaction(state, context, agreement.customerId, debt.id, allocated, method);
    if (!collected.ok) return collected;
    collections.push(collected.value);
    remaining -= allocated;
  }
  return remaining
    ? failure('El saldo de los documentos cambió. Revisa el acuerdo antes de continuar.')
    : success(collections);
}
