import { loadServiceConfig } from '@pos-platform/backend';
import type { ServiceConfig } from '@pos-platform/backend';

export function loadConfig(env: NodeJS.ProcessEnv): ServiceConfig {
  return loadServiceConfig(env, { service: 'pos-sync-worker', envPrefix: 'POS_SYNC_WORKER' });
}
