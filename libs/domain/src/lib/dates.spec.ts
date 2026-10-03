import { describe, expect, it } from 'vitest';
import { addCalendarDays, toLocalDate } from './dates';
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
