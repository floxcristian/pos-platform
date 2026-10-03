const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Santiago',
});
const civilDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const chileDayFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Santiago',
});
const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Santiago',
});
export function money(value: number): string {
  return clpFormatter.format(Number.isFinite(value) ? value : 0);
}
export function date(value: string | number | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const calendar = civilDay(value);
    return calendar === null ? '—' : civilDateFormatter.format(calendar);
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}
export function dateTime(value: string | number | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}
export function number(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value);
}

/** A date-only value is a calendar label, not an instant to shift across time zones. */
function civilDay(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  if (year < 1000) return null;
  const timestamp = Date.UTC(year, month - 1, dayOfMonth);
  return new Date(timestamp).toISOString().slice(0, 10) === day ? timestamp : null;
}

/** Inclusive boundary of a Chilean civil day, including days with a missing midnight. */
export function chileDayToISO(day: string, endOfDay = false): string {
  const calendar = civilDay(day);
  if (calendar === null) throw new RangeError('La fecha debe ser un día válido en formato YYYY-MM-DD.');
  const target = endOfDay ? new Date(calendar + 86400000).toISOString().slice(0, 10) : day;
  const targetCalendar = calendar + (endOfDay ? 86400000 : 0);
  // Find the first instant belonging to this local day. IANA rules handle DST;
  // a fixed UTC offset or an assumed local 00:00 would fail at transitions.
  let low = targetCalendar - 43200000;
  let high = targetCalendar + 129600000;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (chileDayFormatter.format(middle) < target) low = middle + 1;
    else high = middle;
  }
  return new Date(low - (endOfDay ? 1 : 0)).toISOString();
}

/** Quotes every field and neutralizes spreadsheet formulas, including whitespace prefixes. */
export function toSafeCsv(rows: readonly (readonly unknown[])[]): string {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => {
            let cell = String(value ?? '');
            let offset = 0;
            while (offset < cell.length && (cell.charCodeAt(offset) <= 32 || /\s/u.test(cell[offset])))
              offset++;
            if (['=', '+', '@', '-'].includes(cell[offset] ?? '')) cell = "'" + cell;
            return '"' + cell.replaceAll('"', '""') + '"';
          })
          .join(';'),
      )
      .join('\r\n')
  );
}
export function downloadCsv(filename: string, rows: readonly (readonly unknown[])[]): void {
  const blob = new Blob([toSafeCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
