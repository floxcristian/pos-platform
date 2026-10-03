import { describe, expect, it } from 'vitest';
import { chileDayToISO, date, money, toSafeCsv } from './format';

describe('exportación CSV', () => {
  it('neutraliza fórmulas y conserva comillas, delimitadores y saltos de línea', () => {
    const output = toSafeCsv([
      ['=SUM(A1)', ' \t+cmd', '@formula', '-formula', 'texto;"válido"\nsegunda línea', 25000],
    ]);
    expect(output).toContain('"\'=SUM(A1)"');
    expect(output).toContain('"\' \t+cmd"');
    expect(output).toContain('"\'@formula"');
    expect(output).toContain('"\'-formula"');
    expect(output).toContain('"texto;""válido""\nsegunda línea"');
    expect(output).toContain('"25000"');
    expect(output.startsWith('\uFEFF')).toBe(true);
  });
  it('formatea CLP sin decimales', () => {
    expect(money(123456)).toContain('123.456');
  });
});

describe('fechas civiles y límites del día en Chile', () => {
  it('preserva el día civil sin interpretar YYYY-MM-DD como un evento UTC', () => {
    expect(date('2026-05-04')).toMatch(/^04.*2026$/);
    expect(date('2026-10-03')).toMatch(/^03.*2026$/);
    expect(date('2026-09-06')).toMatch(/^06.*2026$/);
    expect(date('2026-02-30')).toBe('—');
    expect(date('2026-10-03T01:00:00Z')).toMatch(/^02.*2026$/);
  });
  it('usa el offset de invierno y límites inclusivos', () => {
    expect(chileDayToISO('2026-05-04')).toBe('2026-05-04T04:00:00.000Z');
    expect(chileDayToISO('2026-05-04', true)).toBe('2026-05-05T03:59:59.999Z');
  });
  it('usa el offset de verano', () => {
    expect(chileDayToISO('2026-10-03')).toBe('2026-10-03T03:00:00.000Z');
    expect(chileDayToISO('2026-10-03', true)).toBe('2026-10-04T02:59:59.999Z');
  });
  it('resuelve el primer instante de un día cuyo horario de verano omite la medianoche', () => {
    expect(chileDayToISO('2026-09-06')).toBe('2026-09-06T04:00:00.000Z');
    expect(chileDayToISO('2026-09-06', true)).toBe('2026-09-07T02:59:59.999Z');
    expect(Date.parse(chileDayToISO('2026-09-06', true)) - Date.parse(chileDayToISO('2026-09-06')) + 1).toBe(
      23 * 60 * 60 * 1000,
    );
  });
  it('rechaza días inválidos para crear intervalos de vigencia', () => {
    expect(() => chileDayToISO('2026-02-30')).toThrow(RangeError);
    expect(() => chileDayToISO('')).toThrow(RangeError);
  });
});
