import { describe, expect, it } from 'vitest';
import { addCalendarDays, chileCivilDate, toLocalDate } from './dates';
describe('civil due dates', () => {
  it('preserves the selected calendar date without a timezone conversion', () => {
    expect(toLocalDate('2026-10-03')).toBe('2026-10-03');
    expect(addCalendarDays('2026-10-03', 30)).toBe('2026-11-02');
  });
  it('rejects impossible dates instead of silently normalizing them', () => {
    expect(toLocalDate('2026-02-31')).toBeNull();
    expect(toLocalDate('2026-99-01')).toBeNull();
    expect(toLocalDate('')).toBeNull();
    expect(toLocalDate('2024-02-29')).toBe('2024-02-29');
  });
});

describe('fecha civil de la operación en Chile', () => {
  it('conserva el día anterior durante la noche aunque UTC ya cambió de fecha', () => {
    expect(chileCivilDate('2026-10-04T02:59:59.999Z')).toBe('2026-10-03');
    expect(chileCivilDate('2026-10-04T03:00:00.000Z')).toBe('2026-10-04');
    expect(chileCivilDate('2026-05-05T03:59:59.999Z')).toBe('2026-05-04');
    expect(chileCivilDate('2026-05-05T04:00:00.000Z')).toBe('2026-05-05');
  });

  it('respeta las transiciones DST de IANA, incluida la medianoche inexistente', () => {
    expect(chileCivilDate('2026-09-06T03:59:59.999Z')).toBe('2026-09-05');
    expect(chileCivilDate('2026-09-06T04:00:00.000Z')).toBe('2026-09-06');
    expect(chileCivilDate('2026-04-05T03:59:59.999Z')).toBe('2026-04-04');
    expect(chileCivilDate('2026-04-05T04:00:00.000Z')).toBe('2026-04-05');
  });

  it('preserva fechas civiles y rechaza entradas inválidas', () => {
    expect(chileCivilDate('2026-09-06')).toBe('2026-09-06');
    expect(chileCivilDate(new Date('2026-10-04T01:00:00Z'))).toBe('2026-10-03');
    expect(() => chileCivilDate('2026-02-30')).toThrow(RangeError);
    expect(() => chileCivilDate('')).toThrow(RangeError);
  });
});
