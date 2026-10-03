import { describe, expect, it } from 'vitest';
import { SyncSchedule } from './models';
import { nextScheduledRun, validateSchedule } from './scheduler';
const schedule: SyncSchedule = {
  enabled: true,
  mode: 'interval',
  intervalMinutes: 15,
  time: '08:00',
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  timezone: 'America/Santiago',
};
describe('local mock scheduler', () => {
  it('never schedules a disabled or manual job', () => {
    expect(nextScheduledRun({ ...schedule, enabled: false }, new Date())).toBeNull();
    expect(nextScheduledRun({ ...schedule, mode: 'manual' }, new Date())).toBeNull();
  });
  it('advances intervals from the last dispatch', () => {
    expect(nextScheduledRun(schedule, new Date('2026-10-03T12:00:00Z'))).toBe('2026-10-03T12:15:00.000Z');
  });
  it('interprets a daily time in Santiago, independent of host timezone', () => {
    expect(
      nextScheduledRun({ ...schedule, mode: 'daily', time: '08:00' }, new Date('2026-10-03T10:00:00Z')),
    ).toBe('2026-10-03T11:00:00.000Z');
  });
  it('honors weekdays when the next day is not allowed', () => {
    expect(
      nextScheduledRun(
        { ...schedule, mode: 'daily', time: '08:00', weekdays: [1] },
        new Date('2026-10-03T12:00:00Z'),
      ),
    ).toBe('2026-10-05T11:00:00.000Z');
  });
  it('rejects impossible intervals, times and weekdays', () => {
    expect(validateSchedule({ ...schedule, intervalMinutes: 0 }).ok).toBe(false);
    expect(validateSchedule({ ...schedule, time: '25:00' }).ok).toBe(false);
    expect(validateSchedule({ ...schedule, weekdays: [] }).ok).toBe(false);
  });
});
