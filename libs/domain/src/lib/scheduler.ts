import { Result, SyncSchedule, failure, success } from './models';

export function validateSchedule(schedule: SyncSchedule): Result<SyncSchedule> {
  if (!['manual', 'interval', 'daily'].includes(schedule.mode))
    return failure('El tipo de programación no es válido.');
  if (
    !Number.isInteger(schedule.intervalMinutes) ||
    schedule.intervalMinutes < 1 ||
    schedule.intervalMinutes > 10080
  )
    return failure('El intervalo debe ser entre 1 y 10.080 minutos.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time)) return failure('La hora debe usar el formato HH:mm.');
  if (
    !schedule.weekdays.length ||
    schedule.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  )
    return failure('Selecciona al menos un día válido.');
  if (schedule.timezone !== 'America/Santiago')
    return failure('La programación usa la zona America/Santiago.');
  return success(schedule);
}
function zonedParts(
  date: Date,
  formatter: Intl.DateTimeFormat,
): { weekday: number; time: string; day: string } {
  const values = formatter.formatToParts(date);
  const find = (key: Intl.DateTimeFormatPartTypes): string =>
    values.find((part) => part.type === key)?.value ?? '';
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(find('weekday')),
    time: `${find('hour')}:${find('minute')}`,
    day: `${find('year')}-${find('month')}-${find('day')}`,
  };
}
/** The mock scheduler only runs while the app is open. UTC iteration handles DST gaps and folds. */
export function nextScheduledRun(schedule: SyncSchedule, after: Date): string | null {
  if (!schedule.enabled || schedule.mode === 'manual' || !validateSchedule(schedule).ok) return null;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const seenDays = new Set<string>();
  const start =
    schedule.mode === 'interval'
      ? after.getTime() + schedule.intervalMinutes * 60000
      : // Include the preceding day to recognize the first occurrence of a repeated local hour.
        Math.floor(after.getTime() / 60000) * 60000 - 24 * 60 * 60000;
  for (let minute = 0; minute < 16 * 24 * 60; minute++) {
    const candidate = new Date(start + minute * 60000);
    const parts = zonedParts(candidate, formatter);
    if (
      schedule.weekdays.includes(parts.weekday) &&
      (schedule.mode === 'interval' || parts.time === schedule.time)
    ) {
      if (schedule.mode === 'daily') {
        if (seenDays.has(parts.day)) continue;
        seenDays.add(parts.day);
      }
      if (candidate.getTime() > after.getTime()) return candidate.toISOString();
    }
  }
  return null;
}
