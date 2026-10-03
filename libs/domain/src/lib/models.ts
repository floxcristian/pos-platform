export type Role = 'admin' | 'supervisor' | 'cashier' | 'auditor';
export type Permission =
  | 'sell'
  | 'cash'
  | 'refund'
  | 'collect'
  | 'masters'
  | 'pricing'
  | 'reports'
  | 'sync'
  | 'configure'
  | 'users'
  | 'audit'
  | 'devices';
export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };
export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = <T = never>(error: string): Result<T> => ({ ok: false, error });
export type ModuleId =
  | 'sales'
  | 'cash'
  | 'collections'
  | 'returns'
  | 'masters'
  | 'pricing'
  | 'reports'
  | 'sync'
  | 'audit'
  | 'users'
  | 'branches'
  | 'devices'
  | 'integrations'
  | 'updates'
  | 'cashPayment'
  | 'splitPayment'
  | 'chequePayment'
  | 'creditPayment'
  | 'creditNotePayment'
  | 'usdPayment'
  | 'advancePayment'
  | 'discounts'
  | 'offlineSales';
export type DocumentType = 'boleta' | 'factura';
export type PaymentMethod =
  | 'efectivo'
  | 'debito'
  | 'credito'
  | 'transferencia'
  | 'cheque'
  | 'cuenta'
  | 'nota_credito'
  | 'usd'
  | 'anticipo';
export type FiscalStatus = 'pending' | 'issued' | 'failed';
export type PaymentStatus = 'confirmed' | 'pending' | 'unknown' | 'failed';
export type ErpStatus = 'pending' | 'synced' | 'failed';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  active: boolean;
  taxRate: number;
  updatedAt: string;
}
export interface Customer {
  id: string;
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  business: string;
  creditLimit: number;
  creditUsed: number;
  creditTerms: { installments: number; periodDays: number };
  active: boolean;
  updatedAt: string;
}
export interface CartLine {
  productId: string;
  quantity: number;
  discount: number;
}
export interface SaleLine extends CartLine {
  name: string;
  sku: string;
  unitPrice: number;
  total: number;
}
export interface PaymentDetails {
  bankId?: string;
  plazaId?: string;
  chequeNumber?: string;
  accountNumber?: string;
  dueAt?: string;
  currencyAmount?: number;
  exchangeRate?: number;
  issuerName?: string;
  issuerRut?: string;
  holderName?: string;
  holderRut?: string;
}
export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference: string;
  details?: PaymentDetails;
}
export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  details?: PaymentDetails;
}
export interface SaleMetadata {
  orderReference?: string;
  deliveryMode?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  contact?: string;
  coupon?: string;
}
export interface Sale {
  id: string;
  number: string;
  createdAt: string;
  customerId: string | null;
  customerName: string;
  documentType: DocumentType;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  net: number;
  tax: number;
  total: number;
  payments: Payment[];
  roundingAdjustment: number;
  paidTotal: number;
  cashTendered: number;
  change: number;
  changeDisposition: 'cash' | 'advance';
  changeAdvanceId: string | null;
  paymentStatus: PaymentStatus;
  fiscalStatus: FiscalStatus;
  erpStatus: ErpStatus;
  status: 'completed' | 'partially_returned' | 'returned';
  branchId: string;
  cashier: string;
  sessionId: string;
  idempotencyKey: string;
  metadata: SaleMetadata;
}
export interface CheckoutInput {
  lines: CartLine[];
  customerId?: string | null;
  documentType: DocumentType;
  payments: PaymentInput[];
  idempotencyKey: string;
  paymentScenario?: 'confirmed' | 'unknown' | 'failed';
  metadata?: SaleMetadata;
  cashTendered?: number;
  changeDisposition?: 'cash' | 'advance';
}
export interface HeldSale {
  id: string;
  label: string;
  lines: CartLine[];
  customerId: string | null;
  documentType: DocumentType;
  createdAt: string;
  metadata: SaleMetadata;
}
export interface ActiveSaleDraft {
  lines: CartLine[];
  customerId: string | null;
  documentType: DocumentType;
  metadata: SaleMetadata;
  updatedAt: string;
}
export interface CashSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  cashier: string;
  openingAmount: number;
  countedAmount: number | null;
  expectedAmount: number;
  difference: number | null;
  status: 'open' | 'closed';
  branchId: string;
}
export interface CashMovement {
  id: string;
  sessionId: string;
  type: 'opening' | 'sale' | 'income' | 'expense' | 'custody' | 'collection' | 'advance' | 'refund';
  amount: number;
  reason: string;
  createdAt: string;
  actor: string;
  reference: string;
}
export interface Receivable {
  id: string;
  customerId: string;
  document: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}
export interface Collection {
  id: string;
  customerId: string;
  receivableId: string | null;
  amount: number;
  method: PaymentMethod;
  kind: 'collection' | 'advance';
  appliedAmount: number;
  createdAt: string;
  reference: string;
  branchId: string;
  sessionId: string;
}
export interface CreditNote {
  id: string;
  number: string;
  saleId: string;
  amount: number;
  reason: string;
  lineQuantities: Record<string, number>;
  createdAt: string;
  fiscalStatus: FiscalStatus;
  refundMethod: PaymentMethod;
  refundedAmount: number;
  debtOffsetAmount: number;
  refundPaymentAmount: number;
  refundedAt: string | null;
  appliedAmount: number;
}
export interface CreditNoteRefundQuote {
  settlementAmount: number;
  debtOffsetAmount: number;
  refundPaymentAmount: number;
  roundingAdjustment: number;
}
export interface CreditNoteApplicationQuote {
  availableAmount: number;
  debtOffsetAmount: number;
}
export interface ReturnInput {
  saleId: string;
  reason: string;
  quantities: Record<string, number>;
  refundMethod: PaymentMethod;
}
export interface Offer {
  id: string;
  name: string;
  productIds: string[];
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}
export interface SyncSchedule {
  enabled: boolean;
  mode: 'manual' | 'interval' | 'daily';
  intervalMinutes: number;
  time: string;
  weekdays: number[];
  timezone: 'America/Santiago';
}
export interface SyncJob {
  id: string;
  name: string;
  description: string;
  direction: 'inbound' | 'outbound';
  entities: string;
  status: 'idle' | 'running' | 'success' | 'failed' | 'paused';
  progress: number;
  records: number;
  lastRun: string | null;
  nextRun: string | null;
  schedule: SyncSchedule;
  failNext: boolean;
  lastError: string | null;
}
export interface SyncRun {
  id: string;
  jobId: string;
  startedAt: string;
  finishedAt: string | null;
  trigger: 'manual' | 'scheduled';
  status: 'running' | 'success' | 'failed';
  records: number;
  error: string | null;
}
export interface OutboxEvent {
  id: string;
  aggregateId: string;
  type: 'sale.created' | 'credit-note.created' | 'collection.created';
  target: 'erp' | 'fiscal';
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  createdAt: string;
  deliveredAt: string | null;
  lastError: string | null;
}
export interface LogEntry {
  id: string;
  createdAt: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  correlationId: string;
}
export interface AuditIdentity {
  actor: string;
  role: Role | 'system';
}
export interface AuditEntry extends AuditIdentity {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  detail: string;
}
export interface Device {
  id: string;
  name: string;
  type: 'printer' | 'payment' | 'scanner' | 'drawer' | 'cheque';
  connection: string;
  enabled: boolean;
  status: 'ready' | 'offline' | 'error';
  lastTest: string | null;
}
export interface FeatureModule {
  id: ModuleId;
  name: string;
  description: string;
  enabled: boolean;
  category: 'operation' | 'management' | 'platform' | 'policy';
}
export interface PosUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  branchIds: string[];
}
export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
  terminals: number;
  online: boolean;
}
export interface Integration {
  id: string;
  name: string;
  kind: 'erp' | 'fiscal' | 'payments' | 'cheques';
  provider: string;
  enabled: boolean;
  status: 'connected' | 'offline' | 'error';
  lastTest: string | null;
}
export type ReferenceKind = 'bank' | 'plaza' | 'returnReason' | 'seller';
export interface ReferenceItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
}
export interface PriceRule {
  id: string;
  name: string;
  productId: string;
  customerId: string | null;
  minQuantity: number;
  unitPrice: number;
  enabled: boolean;
}
export interface SalesOrder {
  id: string;
  number: string;
  customerId: string;
  lines: (CartLine & { unitPrice: number })[];
  locked: boolean;
  deliveryMode: 'pickup' | 'delivery';
  address: string;
  contact: string;
  status: 'open' | 'in_payment' | 'paid';
  saleId: string | null;
}
export interface Installment {
  id: string;
  number: number;
  dueAt: string;
  amount: number;
  balance: number;
}
export interface Agreement {
  id: string;
  customerId: string;
  receivableIds: string[];
  createdAt: string;
  installments: Installment[];
  status: 'active' | 'paid';
}
export interface AgreementInput {
  customerId: string;
  receivableIds: string[];
  installments: number;
  startDate: string;
  periodDays: number;
}
export interface CustodyDeposit {
  id: string;
  movementId: string;
  bankId: string;
  reference: string;
  date: string;
  amount: number;
  createdAt: string;
}
export interface AppUpdate {
  currentVersion: string;
  availableVersion: string;
  channel: 'stable' | 'preview';
  status: 'current' | 'available' | 'downloaded';
  checkedAt: string | null;
}
export interface PosSettings {
  companyName: string;
  companyRut: string;
  branchId: string;
  terminalId: string;
  currency: 'CLP';
  taxRate: 19;
  maxDiscountPercent: number;
  offlineLimit: number;
  autoPrint: boolean;
  receiptMessage: string;
  theme: 'light' | 'dark' | 'system';
}
export interface PosSnapshot {
  schemaVersion: 1;
  products: Product[];
  priceRules: PriceRule[];
  customers: Customer[];
  sales: Sale[];
  salesOrders: SalesOrder[];
  agreements: Agreement[];
  custodyDeposits: CustodyDeposit[];
  heldSales: HeldSale[];
  activeDraft: ActiveSaleDraft | null;
  session: CashSession | null;
  sessions: CashSession[];
  cashMovements: CashMovement[];
  receivables: Receivable[];
  collections: Collection[];
  creditNotes: CreditNote[];
  offers: Offer[];
  syncJobs: SyncJob[];
  syncRuns: SyncRun[];
  outbox: OutboxEvent[];
  logs: LogEntry[];
  audit: AuditEntry[];
  devices: Device[];
  modules: FeatureModule[];
  users: PosUser[];
  branches: Branch[];
  referenceCatalogs: Record<ReferenceKind, ReferenceItem[]>;
  integrations: Integration[];
  settings: PosSettings;
  update: AppUpdate;
  role: Role;
  online: boolean;
}
export interface SaleTotals {
  subtotal: number;
  discount: number;
  net: number;
  tax: number;
  total: number;
  cashTotal: number;
  lines: SaleLine[];
}
