import { InjectionToken } from '@angular/core';
import { LocalSnapshotRepository, SnapshotRepository } from './persistence';

/** Replace these ports with API / Tauri adapters; components never access host APIs. */
export interface SimulationPort {
  wait(milliseconds: number): Promise<void>;
  now(): Date;
  id(prefix: string): string;
}
export const POS_REPOSITORY = new InjectionToken<SnapshotRepository>('POS_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    try {
      return new LocalSnapshotRepository(typeof localStorage === 'undefined' ? null : localStorage);
    } catch {
      return new LocalSnapshotRepository(null);
    }
  },
});
export const POS_SIMULATION = new InjectionToken<SimulationPort>('POS_SIMULATION', {
  providedIn: 'root',
  factory: () => ({
    wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now: () => new Date(),
    id: (prefix) => `${prefix}-${crypto.randomUUID()}`,
  }),
});
