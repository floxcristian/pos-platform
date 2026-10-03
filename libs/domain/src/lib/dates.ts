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
