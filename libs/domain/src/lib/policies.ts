import {
  CartLine,
  FeatureModule,
  ModuleId,
  Permission,
  Product,
  Result,
  Role,
  SaleTotals,
  failure,
  success,
} from './models';

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: [
    'sell',
    'cash',
    'refund',
    'collect',
    'masters',
    'pricing',
    'reports',
    'sync',
    'configure',
    'users',
    'audit',
    'devices',
  ],
  supervisor: [
    'sell',
    'cash',
    'refund',
    'collect',
    'masters',
    'pricing',
    'reports',
    'sync',
    'audit',
    'devices',
  ],
  cashier: ['sell', 'cash', 'collect', 'devices'],
  auditor: ['reports', 'audit'],
};
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  cashier: 'Cajero',
  auditor: 'Auditor',
};
export const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  debito: 'Tarjeta de débito',
  credito: 'Tarjeta de crédito',
  transferencia: 'Transferencia',
  cheque: 'Cheque · Orsan',
  cuenta: 'Crédito cliente',
  nota_credito: 'Nota de crédito',
  usd: 'Dólares estadounidenses',
  anticipo: 'Anticipo de cliente',
} as const;
export function canPerform(
  role: Role,
  permission: Permission,
  modules: readonly FeatureModule[],
  module?: ModuleId,
): boolean {
  return (
    ROLE_PERMISSIONS[role].includes(permission) &&
    (!module || modules.some((item) => item.id === module && item.enabled))
  );
}
export function calculateTotals(
  lines: readonly CartLine[],
  products: readonly Product[],
): Result<SaleTotals> {
  if (!lines.length) return failure('Agrega al menos un producto.');
  const seen = new Set<string>();
  const result: SaleTotals = { subtotal: 0, discount: 0, net: 0, tax: 0, total: 0, cashTotal: 0, lines: [] };
  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product || !product.active) return failure('Hay un producto no disponible.');
    if (seen.has(line.productId)) return failure('Agrupa las unidades del mismo producto en una línea.');
    seen.add(line.productId);
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > 9999)
      return failure('La cantidad debe ser un entero entre 1 y 9.999.');
    if (!Number.isFinite(line.discount) || line.discount < 0 || line.discount > 100)
      return failure('El descuento debe estar entre 0 y 100 %.');
    const subtotal = product.price * line.quantity;
    const discount = Math.round((subtotal * line.discount) / 100);
    const total = subtotal - discount;
    if (![subtotal, discount, total].every(Number.isSafeInteger))
      return failure('El importe excede el rango admitido.');
    result.subtotal += subtotal;
    result.discount += discount;
    result.total += total;
    result.lines.push({ ...line, name: product.name, sku: product.sku, unitPrice: product.price, total });
  }
  if (!Number.isSafeInteger(result.total)) return failure('El total excede el rango admitido.');
  result.net = Math.round(result.total / 1.19);
  result.tax = result.total - result.net;
  result.cashTotal = roundCash(result.total);
  return success(result);
}
/** Chile: last digit 1–5 rounds down; 6–9 rounds up. Does not change the tax base. */
export function roundCash(amount: number): number {
  const remainder = amount % 10;
  return amount - remainder + (remainder > 5 ? 10 : 0);
}
export const validMoney = (value: number, allowZero = false): boolean =>
  Number.isSafeInteger(value) && (allowZero ? value >= 0 : value > 0);
export function isValidRut(value: string): boolean {
  const normalized = value.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  let multiplier = 2,
    sum = 0;
  for (let index = body.length - 1; index >= 0; index--) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const check = 11 - (sum % 11);
  return normalized.slice(-1) === (check === 11 ? '0' : check === 10 ? 'K' : String(check));
}
