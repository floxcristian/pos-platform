import { describe, expect, it } from 'vitest';
import { localDate, totalSales, withinDates } from './analytics';

describe('períodos de reportes en Chile', () => {
  it('atribuye operaciones de madrugada UTC al día local correspondiente', () => {
    expect(localDate('2026-10-03T01:00:00Z')).toBe('2026-10-02');
    expect(withinDates('2026-10-03T01:00:00Z', '2026-10-02', '2026-10-02')).toBe(true);
    expect(withinDates('2026-10-03T01:00:00Z', '2026-10-03', '2026-10-03')).toBe(false);
  });
  it('excluye pagos desconocidos, pendientes y fallidos del total confirmado', () => {
    expect(
      totalSales([
        { total: 12000, paymentStatus: 'confirmed' },
        { total: 8000, paymentStatus: 'unknown' },
        { total: 4000, paymentStatus: 'pending' },
        { total: 6000, paymentStatus: 'failed' },
      ]),
    ).toBe(12000);
  });
});
