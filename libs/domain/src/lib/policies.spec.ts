import { describe, expect, it } from 'vitest';
import { FeatureModule, Product } from './models';
import { calculateTotals, canPerform, isValidRut } from './policies';
const product: Product = {
  id: 'p1',
  sku: 'DEMO',
  barcode: '',
  name: 'Producto de prueba',
  category: 'Demo',
  brand: 'Demo',
  price: 1190,
  cost: 500,
  stock: 0,
  unit: 'un',
  active: true,
  taxRate: 19,
  updatedAt: '2026-10-03T12:00:00Z',
};
describe('CLP and Chile tax policy', () => {
  it('extracts VAT from tax-inclusive prices without adding it again', () => {
    const quote = calculateTotals([{ productId: 'p1', quantity: 2, discount: 0 }], [product]);
    expect(quote.ok && quote.value).toMatchObject({
      subtotal: 2380,
      discount: 0,
      net: 2000,
      tax: 380,
      total: 2380,
    });
  });
  it('rounds line discounts to pesos and preserves net + tax = total', () => {
    const quote = calculateTotals(
      [{ productId: 'p1', quantity: 3, discount: 7.5 }],
      [{ ...product, price: 999 }],
    );
    expect(quote.ok && quote.value).toMatchObject({ subtotal: 2997, discount: 225, total: 2772 });
    if (quote.ok) expect(quote.value.net + quote.value.tax).toBe(quote.value.total);
  });
  it.each([0, -1, 1.5, NaN, Infinity, 10000])('rejects invalid quantities %s', (quantity) => {
    expect(calculateTotals([{ productId: 'p1', quantity, discount: 0 }], [product]).ok).toBe(false);
  });
  it('rejects repeated products and overflow', () => {
    expect(
      calculateTotals(
        [
          { productId: 'p1', quantity: 1, discount: 0 },
          { productId: 'p1', quantity: 1, discount: 0 },
        ],
        [product],
      ).ok,
    ).toBe(false);
    expect(
      calculateTotals(
        [{ productId: 'p1', quantity: 2, discount: 0 }],
        [{ ...product, price: Number.MAX_SAFE_INTEGER }],
      ).ok,
    ).toBe(false);
  });
  it('uses stock only as consultation, never as a sale authority', () => {
    expect(
      calculateTotals([{ productId: 'p1', quantity: 2, discount: 0 }], [{ ...product, stock: 0 }]).ok,
    ).toBe(true);
  });
  it('validates a RUT check digit without claiming a person exists', () => {
    expect(isValidRut('90.000.000-6')).toBe(true);
    expect(isValidRut('90.000.000-0')).toBe(false);
  });
});
describe('central authorization', () => {
  const modules: FeatureModule[] = [
    { id: 'sales', name: 'Venta', enabled: true, description: '', category: 'operation' },
  ];
  it('requires both role permission and enabled module', () => {
    expect(canPerform('cashier', 'sell', modules, 'sales')).toBe(true);
    expect(canPerform('cashier', 'refund', modules, 'sales')).toBe(false);
    expect(canPerform('admin', 'sell', [{ ...modules[0], enabled: false }], 'sales')).toBe(false);
    expect(canPerform('auditor', 'reports', modules)).toBe(true);
    expect(canPerform('auditor', 'sell', modules, 'sales')).toBe(false);
  });
});
