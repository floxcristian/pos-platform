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
function zonedParts(date: Date, timezone: string): { weekday: number; time: string } {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const find = (key: Intl.DateTimeFormatPartTypes): string =>
    values.find((part) => part.type === key)?.value ?? '';
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(find('weekday')),
    time: `${find('hour')}:${find('minute')}`,
  };
}
/** The mock scheduler only runs while the app is open. UTC iteration handles DST gaps and folds. */
export function nextScheduledRun(schedule: SyncSchedule, after: Date): string | null {
  if (!schedule.enabled || schedule.mode === 'manual' || !validateSchedule(schedule).ok) return null;
  const start =
    schedule.mode === 'interval'
      ? after.getTime() + schedule.intervalMinutes * 60000
      : Math.floor(after.getTime() / 60000) * 60000 + 60000;
  for (let minute = 0; minute < 15 * 24 * 60; minute++) {
    const candidate = new Date(start + minute * 60000);
    const parts = zonedParts(candidate, schedule.timezone);
    if (
      schedule.weekdays.includes(parts.weekday) &&
      (schedule.mode === 'interval' || parts.time === schedule.time)
    )
      return candidate.toISOString();
  }
  return null;
}
