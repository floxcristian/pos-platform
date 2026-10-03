import { CartLine, PriceRule, Product, Result, SaleTotals, failure } from './models';
import { calculateTotals } from './policies';

export function selectPriceRule(
  rules: readonly PriceRule[],
  productId: string,
  quantity: number,
  customerId: string | null,
): PriceRule | undefined {
  return rules
    .filter(
      (rule) =>
        rule.enabled &&
        rule.productId === productId &&
        rule.minQuantity <= quantity &&
        (rule.customerId === null || rule.customerId === customerId),
    )
    .sort(
      (a, b) =>
        Number(b.customerId !== null) - Number(a.customerId !== null) || b.minQuantity - a.minQuantity,
    )[0];
}
/** Client agreements take precedence, then the largest eligible quantity tier. Never stack discounts. */
export function priceCart(
  lines: readonly CartLine[],
  products: readonly Product[],
  rules: readonly PriceRule[],
  customerId: string | null = null,
): Result<SaleTotals> {
  const prices = new Map<string, number>();
  for (const line of lines) {
    const rule = selectPriceRule(rules, line.productId, line.quantity, customerId);
    if (rule) {
      if (line.discount > 0)
        return failure(
          'El precio por cliente o cantidad no se acumula con otro descuento. Quita el descuento de esa línea.',
        );
      prices.set(line.productId, rule.unitPrice);
    }
  }
  return calculateTotals(
    lines,
    products.map((product) =>
      prices.has(product.id) ? { ...product, price: prices.get(product.id) ?? product.price } : product,
    ),
  );
}
