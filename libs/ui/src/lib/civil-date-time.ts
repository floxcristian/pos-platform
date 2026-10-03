/** PrimeNG uses Date for calendar fields; the domain keeps civil strings, never instants. */
export function civilDateToPicker(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function pickerDateToCivil(value: unknown): string {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return '';
  const year = value.getFullYear();
  if (year < 1000 || year > 9999) return '';
  return `${year}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function civilTimeToPicker(value: string | null | undefined): Date | null {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  // A stable local calendar anchor avoids binding a wall-clock preference to today's DST change.
  return new Date(2000, 0, 15, hour, minute);
}

export function pickerTimeToCivil(value: unknown): string {
  return value instanceof Date && Number.isFinite(value.getTime())
    ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
    : '';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
