import { InjectionToken } from '@angular/core';

export type ClientPlatform = 'desktop' | 'mobile';

/** The composition root chooses the client; viewport size alone does not identify a device. */
export const CLIENT_PLATFORM = new InjectionToken<ClientPlatform>('CLIENT_PLATFORM');
