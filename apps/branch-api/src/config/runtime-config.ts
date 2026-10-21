import { loadRuntimeConfig } from '@pos-platform/backend';
import type { RuntimeConfig } from '@pos-platform/backend';
export type { RuntimeConfig } from '@pos-platform/backend';

export function loadConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  return loadRuntimeConfig(env, { service: 'branch-api', envPrefix: 'BRANCH_API', defaultPort: 3000 });
}
