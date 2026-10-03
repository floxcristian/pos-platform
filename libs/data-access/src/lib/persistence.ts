import { PosSnapshot, Result, failure, success } from '@corporate-pos/domain';

export const STORAGE_KEY = 'corporate-pos:demo:v1';
export interface SnapshotRepository {
  load(): Result<PosSnapshot | null>;
  save(snapshot: PosSnapshot): Result<void>;
  clear(): Result<void>;
}
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
type Check = (value: unknown) => boolean;
const str: Check = (value) => typeof value === 'string' && value.length <= 100000;
const num: Check = (value) => typeof value === 'number' && Number.isFinite(value);
const int: Check = (value) => num(value) && Number.isSafeInteger(value);
const money: Check = (value) => int(value) && Number(value) >= 0;
const bool: Check = (value) => typeof value === 'boolean';
const one =
  (...values: readonly unknown[]): Check =>
  (value) =>
    values.includes(value);
const nullable =
  (check: Check): Check =>
  (value) =>
    value === null || check(value);
const arr =
  (check: Check): Check =>
  (value) =>
    Array.isArray(value) && value.length < 100000 && value.every(check);
const obj =
  (shape: Record<string, Check>): Check =>
  (value) =>
    isRecord(value) &&
    Object.entries(shape).every(([key, check]) => Object.hasOwn(value, key) && check(value[key]));
const date: Check = (value) => str(value) && !Number.isNaN(Date.parse(String(value)));
const role = one('admin', 'supervisor', 'cashier', 'auditor');
const method = one(
  'efectivo',
  'debito',
  'credito',
  'transferencia',
  'cheque',
  'cuenta',
  'nota_credito',
  'usd',
  'anticipo',
);
const fiscal = one('pending', 'issued', 'failed');
const paymentStatus = one('confirmed', 'pending', 'unknown', 'failed');
const payment: Check = (value) => {
  if (
    !obj({ id: str, method, amount: money, status: paymentStatus, reference: str })(value) ||
    !isRecord(value)
  )
    return false;
  if (!Object.hasOwn(value, 'details')) return true;
  const details = value['details'];
  if (!isRecord(details)) return false;
  return Object.entries(details).every(([key, field]) =>
    [
      'bankId',
      'plazaId',
      'chequeNumber',
      'accountNumber',
      'dueAt',
      'issuerName',
      'issuerRut',
      'holderName',
      'holderRut',
    ].includes(key)
      ? str(field)
      : ['currencyAmount', 'exchangeRate'].includes(key) && num(field),
  );
};
const moduleId = one(
  'sales',
  'cash',
  'collections',
  'returns',
  'masters',
  'pricing',
  'reports',
  'sync',
  'audit',
  'users',
  'branches',
  'devices',
  'integrations',
  'updates',
  'cashPayment',
  'splitPayment',
  'chequePayment',
  'creditPayment',
  'creditNotePayment',
  'usdPayment',
  'advancePayment',
  'discounts',
  'offlineSales',
);
const metadata: Check = (value) =>
  isRecord(value) &&
  Object.entries(value).every(
    ([key, field]) =>
      ['orderReference', 'deliveryMode', 'deliveryAddress', 'contact', 'coupon'].includes(key) && str(field),
  );
const cartLine = { productId: str, quantity: money, discount: num };
const session = obj({
  id: str,
  openedAt: date,
  closedAt: nullable(date),
  cashier: str,
  openingAmount: money,
  countedAmount: nullable(money),
  expectedAmount: money,
  difference: nullable(int),
  status: one('open', 'closed'),
  branchId: str,
});
const schedule = obj({
  enabled: bool,
  mode: one('manual', 'interval', 'daily'),
  intervalMinutes: money,
  time: str,
  weekdays: arr((value) => int(value) && Number(value) >= 0 && Number(value) <= 6),
  timezone: one('America/Santiago'),
});
const shape: Check = obj({
  schemaVersion: one(1),
  salesOrders: arr(
    obj({
      id: str,
      number: str,
      customerId: str,
      lines: arr(obj({ ...cartLine, unitPrice: money })),
      locked: bool,
      deliveryMode: one('pickup', 'delivery'),
      address: str,
      contact: str,
      status: one('open', 'in_payment', 'paid'),
      saleId: nullable(str),
    }),
  ),
  agreements: arr(
    obj({
      id: str,
      customerId: str,
      receivableIds: arr(str),
      createdAt: date,
      installments: arr(obj({ id: str, number: money, dueAt: date, amount: money, balance: money })),
      status: one('active', 'paid'),
    }),
  ),
  custodyDeposits: arr(
    obj({ id: str, movementId: str, bankId: str, reference: str, date, amount: money, createdAt: date }),
  ),
  products: arr(
    obj({
      id: str,
      sku: str,
      barcode: str,
      name: str,
      category: str,
      brand: str,
      price: money,
      cost: money,
      stock: money,
      unit: str,
      active: bool,
      taxRate: num,
      updatedAt: date,
    }),
  ),
  priceRules: arr(
    obj({
      id: str,
      name: str,
      productId: str,
      customerId: nullable(str),
      minQuantity: money,
      unitPrice: money,
      enabled: bool,
    }),
  ),
  customers: arr(
    obj({
      id: str,
      rut: str,
      name: str,
      email: str,
      phone: str,
      address: str,
      city: str,
      business: str,
      creditLimit: money,
      creditUsed: money,
      creditTerms: obj({ installments: money, periodDays: money }),
      active: bool,
      updatedAt: date,
    }),
  ),
  sales: arr(
    obj({
      id: str,
      number: str,
      createdAt: date,
      customerId: nullable(str),
      customerName: str,
      documentType: one('boleta', 'factura'),
      lines: arr(obj({ ...cartLine, name: str, sku: str, unitPrice: money, total: money })),
      subtotal: money,
      discount: money,
      net: money,
      tax: money,
      total: money,
      roundingAdjustment: int,
      paidTotal: money,
      cashTendered: money,
      change: money,
      changeDisposition: one('cash', 'advance'),
      changeAdvanceId: nullable(str),
      payments: arr(payment),
      paymentStatus,
      fiscalStatus: fiscal,
      erpStatus: one('pending', 'synced', 'failed'),
      status: one('completed', 'partially_returned', 'returned'),
      branchId: str,
      cashier: str,
      sessionId: str,
      idempotencyKey: str,
      metadata: (value) =>
        isRecord(value) &&
        Object.entries(value).every(
          ([key, field]) =>
            ['orderReference', 'deliveryMode', 'deliveryAddress', 'contact', 'coupon'].includes(key) &&
            str(field),
        ),
    }),
  ),
  activeDraft: nullable(
    obj({
      lines: arr(obj(cartLine)),
      customerId: nullable(str),
      documentType: one('boleta', 'factura'),
      metadata,
      updatedAt: date,
    }),
  ),
  heldSales: arr(
    obj({
      id: str,
      label: str,
      lines: arr(obj(cartLine)),
      customerId: nullable(str),
      documentType: one('boleta', 'factura'),
      createdAt: date,
      metadata,
    }),
  ),
  session: nullable(session),
  sessions: arr(session),
  cashMovements: arr(
    obj({
      id: str,
      sessionId: str,
      type: one('opening', 'sale', 'income', 'expense', 'custody', 'collection', 'advance', 'refund'),
      amount: money,
      reason: str,
      createdAt: date,
      actor: str,
      reference: str,
    }),
  ),
  receivables: arr(
    obj({
      id: str,
      customerId: str,
      document: str,
      issuedAt: date,
      dueAt: date,
      amount: money,
      balance: money,
      status: one('pending', 'partial', 'paid', 'overdue'),
    }),
  ),
  collections: arr(
    obj({
      id: str,
      customerId: str,
      receivableId: nullable(str),
      amount: money,
      method,
      kind: one('collection', 'advance'),
      appliedAmount: money,
      createdAt: date,
      reference: str,
      branchId: str,
      sessionId: str,
    }),
  ),
  creditNotes: arr(
    obj({
      id: str,
      number: str,
      saleId: str,
      amount: money,
      reason: str,
      lineQuantities: (value) => isRecord(value) && Object.values(value).every(money),
      createdAt: date,
      fiscalStatus: fiscal,
      refundMethod: method,
      refundedAmount: money,
      debtOffsetAmount: money,
      refundPaymentAmount: money,
      refundedAt: nullable(date),
      appliedAmount: money,
    }),
  ),
  offers: arr(
    obj({
      id: str,
      name: str,
      productIds: arr(str),
      discountPercent: num,
      startsAt: date,
      endsAt: date,
      active: bool,
    }),
  ),
  syncJobs: arr(
    obj({
      id: str,
      name: str,
      description: str,
      direction: one('inbound', 'outbound'),
      entities: str,
      status: one('idle', 'running', 'success', 'failed', 'paused'),
      progress: num,
      records: money,
      lastRun: nullable(date),
      nextRun: nullable(date),
      schedule,
      failNext: bool,
      lastError: nullable(str),
    }),
  ),
  syncRuns: arr(
    obj({
      id: str,
      jobId: str,
      startedAt: date,
      finishedAt: nullable(date),
      trigger: one('manual', 'scheduled'),
      status: one('running', 'success', 'failed'),
      records: money,
      error: nullable(str),
    }),
  ),
  outbox: arr(
    obj({
      id: str,
      aggregateId: str,
      type: one('sale.created', 'credit-note.created', 'collection.created'),
      target: one('erp', 'fiscal'),
      status: one('pending', 'processing', 'sent', 'failed'),
      attempts: money,
      createdAt: date,
      deliveredAt: nullable(date),
      lastError: nullable(str),
    }),
  ),
  logs: arr(
    obj({
      id: str,
      createdAt: date,
      level: one('info', 'warning', 'error'),
      source: str,
      message: str,
      correlationId: str,
    }),
  ),
  audit: arr(
    obj({
      id: str,
      createdAt: date,
      actor: str,
      role: one('admin', 'supervisor', 'cashier', 'auditor', 'system'),
      action: str,
      entity: str,
      detail: str,
    }),
  ),
  devices: arr(
    obj({
      id: str,
      name: str,
      type: one('printer', 'payment', 'scanner', 'drawer', 'cheque'),
      connection: str,
      enabled: bool,
      status: one('ready', 'offline', 'error'),
      lastTest: nullable(date),
    }),
  ),
  modules: arr(
    obj({
      id: moduleId,
      name: str,
      description: str,
      enabled: bool,
      category: one('operation', 'management', 'platform', 'policy'),
    }),
  ),
  users: arr(obj({ id: str, name: str, email: str, role, active: bool, branchIds: arr(str) })),
  branches: arr(
    obj({
      id: str,
      code: str,
      name: str,
      city: str,
      address: str,
      active: bool,
      terminals: money,
      online: bool,
    }),
  ),
  integrations: arr(
    obj({
      id: str,
      name: str,
      kind: one('erp', 'fiscal', 'payments', 'cheques'),
      provider: str,
      enabled: bool,
      status: one('connected', 'offline', 'error'),
      lastTest: nullable(date),
    }),
  ),
  referenceCatalogs: obj(
    Object.fromEntries(
      ['bank', 'plaza', 'returnReason', 'seller'].map((kind) => [
        kind,
        arr(obj({ id: str, code: str, name: str, active: bool })),
      ]),
    ),
  ),
  settings: obj({
    companyName: str,
    companyRut: str,
    branchId: str,
    terminalId: str,
    currency: one('CLP'),
    taxRate: one(19),
    maxDiscountPercent: num,
    offlineLimit: money,
    autoPrint: bool,
    receiptMessage: str,
    theme: one('light', 'dark', 'system'),
  }),
  update: obj({
    currentVersion: str,
    availableVersion: str,
    channel: one('stable', 'preview'),
    status: one('current', 'available', 'downloaded'),
    checkedAt: nullable(date),
  }),
  role,
  online: bool,
});
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isSnapshot(value: unknown): value is PosSnapshot {
  return shape(value);
}
export function decodeSnapshot(raw: string): Result<PosSnapshot> {
  try {
    const parsed: unknown = JSON.parse(raw);
    // Additive v1 evolution preserves existing demo operations, including earlier credit notes.
    if (isRecord(parsed) && parsed['schemaVersion'] === 1) {
      if (!Object.hasOwn(parsed, 'activeDraft')) parsed['activeDraft'] = null;
      if (Array.isArray(parsed['creditNotes']))
        for (const note of parsed['creditNotes']) {
          if (
            isRecord(note) &&
            !Object.hasOwn(note, 'debtOffsetAmount') &&
            !Object.hasOwn(note, 'refundPaymentAmount') &&
            money(note['refundedAmount'])
          ) {
            note['debtOffsetAmount'] = note['refundMethod'] === 'cuenta' ? note['refundedAmount'] : 0;
            note['refundPaymentAmount'] = Number(note['refundedAmount']) - Number(note['debtOffsetAmount']);
          }
        }
    }
    if (!isSnapshot(parsed))
      return failure(
        'Los datos locales tienen un formato incompatible. Se ha iniciado una nueva demostración.',
      );
    return success(parsed);
  } catch {
    return failure('No se pudieron leer los datos locales. Se ha iniciado una nueva demostración.');
  }
}
export class LocalSnapshotRepository implements SnapshotRepository {
  constructor(private readonly storage: StorageAdapter | null) {}
  load(): Result<PosSnapshot | null> {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? decodeSnapshot(raw) : success(null);
    } catch {
      return failure('El navegador bloqueó la lectura del almacenamiento local.');
    }
  }
  save(snapshot: PosSnapshot): Result<void> {
    if (!this.storage)
      return failure('El almacenamiento local no está disponible. Habilítalo para guardar operaciones.');
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      return success(undefined);
    } catch {
      return failure('No se pudo guardar: el almacenamiento local está lleno o bloqueado.');
    }
  }
  clear(): Result<void> {
    try {
      this.storage?.removeItem(STORAGE_KEY);
      return success(undefined);
    } catch {
      return failure('No se pudo limpiar el almacenamiento local.');
    }
  }
}
