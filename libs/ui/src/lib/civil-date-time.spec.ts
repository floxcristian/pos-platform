import { afterEach, describe, expect, it } from 'vitest';
import {
  civilDateToPicker,
  civilTimeToPicker,
  pickerDateToCivil,
  pickerTimeToCivil,
} from './civil-date-time';

const originalTimezone = process.env['TZ'];
afterEach(() => {
  if (originalTimezone === undefined) delete process.env['TZ'];
  else process.env['TZ'] = originalTimezone;
});

describe('adaptador civil de PrimeNG DatePicker', () => {
  for (const timezone of ['America/Santiago', 'UTC', 'Pacific/Auckland']) {
    it(`conserva días civiles, incluidos cambios DST, en ${timezone}`, () => {
      process.env['TZ'] = timezone;
      for (const day of ['2026-05-04', '2026-10-03', '2026-09-06', '2026-04-05', '2028-02-29']) {
        expect(pickerDateToCivil(civilDateToPicker(day))).toBe(day);
      }
    });

    it(`conserva horarios independientes de la fecha y UTC en ${timezone}`, () => {
      process.env['TZ'] = timezone;
      for (const time of ['00:00', '08:30', '12:00', '23:59']) {
        expect(pickerTimeToCivil(civilTimeToPicker(time))).toBe(time);
      }
    });
  }

  it('representa la selección vacía sin inventar la fecha de hoy', () => {
    expect(civilDateToPicker('')).toBeNull();
    expect(civilDateToPicker(null)).toBeNull();
    expect(civilTimeToPicker(undefined)).toBeNull();
    expect(pickerDateToCivil(null)).toBe('');
    expect(pickerTimeToCivil(null)).toBe('');
  });

  it('rechaza fechas inexistentes, marcas UTC y horas fuera de rango', () => {
    for (const day of [
      '2026-02-29',
      '2026-02-30',
      '2026-13-01',
      '2026-00-01',
      '01/10/2026',
      '2026-10-01T00:00:00Z',
    ]) {
      expect(civilDateToPicker(day)).toBeNull();
    }
    for (const time of ['24:00', '12:60', '8:30', '-1:00', '12:30:15']) {
      expect(civilTimeToPicker(time)).toBeNull();
    }
    expect(pickerDateToCivil(new Date(Number.NaN))).toBe('');
    expect(pickerTimeToCivil(new Date(Number.NaN))).toBe('');
  });
});
