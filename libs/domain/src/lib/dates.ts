const chileCivilFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar label in Chile, independent of the workstation timezone or UTC date. */
export function chileCivilDate(value: string | number | Date = new Date()): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const civil = toLocalDate(value);
    if (!civil) throw new RangeError('La fecha civil no es válida.');
    return civil;
  }
  const instant = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new RangeError('La fecha no es válida.');
  return chileCivilFormatter.format(instant);
}

/** A civil due date has no time or timezone. Event timestamps remain full ISO strings. */
export function toLocalDate(value: string): string | null {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : Number.isFinite(Date.parse(value))
      ? new Date(value).toISOString().slice(0, 10)
      : null;
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}
export function addCalendarDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * 86400000).toISOString().slice(0, 10);
}
