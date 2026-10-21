import { loadRuntimeConfig } from '@pos-platform/backend';
import type { RuntimeConfig } from '@pos-platform/backend';
export type { RuntimeConfig } from '@pos-platform/backend';

export function loadConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  return loadRuntimeConfig(env, { service: 'country-api', envPrefix: 'COUNTRY_API', defaultPort: 3001 });
}
