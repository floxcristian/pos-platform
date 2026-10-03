import { describe, expect, it } from 'vitest';
import { PriceRule, Product } from './models';
import { priceCart } from './pricing';
import { roundCash } from './policies';
const product: Product = {
  id: 'p',
  sku: 'DEMO',
  barcode: '',
  name: 'Demo',
  category: 'Demo',
  brand: 'Demo',
  price: 1001,
  cost: 600,
  stock: 1,
  unit: 'un',
  active: true,
  taxRate: 19,
  updatedAt: '2026-10-03T12:00:00Z',
};
const rules: PriceRule[] = [
  {
    id: 'r1',
    name: 'Escala 10',
    productId: 'p',
    customerId: null,
    minQuantity: 10,
    unitPrice: 950,
    enabled: true,
  },
  {
    id: 'r2',
    name: 'Escala 20',
    productId: 'p',
    customerId: null,
    minQuantity: 20,
    unitPrice: 900,
    enabled: true,
  },
  {
    id: 'r3',
    name: 'Convenio',
    productId: 'p',
    customerId: 'c1',
    minQuantity: 5,
    unitPrice: 880,
    enabled: true,
  },
];
describe('contract pricing and cash rounding', () => {
  it.each([
    [1001, 1000],
    [1005, 1000],
    [1006, 1010],
    [1009, 1010],
    [1010, 1010],
  ])('rounds Chile cash %s to %s', (value, expected) => {
    expect(roundCash(value)).toBe(expected);
  });
  it('prefers the client agreement, then the greatest eligible quantity tier', () => {
    expect(priceCart([{ productId: 'p', quantity: 25, discount: 0 }], [product], rules).ok).toBe(true);
    const general = priceCart([{ productId: 'p', quantity: 25, discount: 0 }], [product], rules);
    expect(general.ok && general.value.lines[0].unitPrice).toBe(900);
    const client = priceCart([{ productId: 'p', quantity: 25, discount: 0 }], [product], rules, 'c1');
    expect(client.ok && client.value.lines[0].unitPrice).toBe(880);
  });
  it('never stacks another discount on a client/quantity price', () => {
    expect(priceCart([{ productId: 'p', quantity: 25, discount: 10 }], [product], rules, 'c1').ok).toBe(
      false,
    );
  });
});
