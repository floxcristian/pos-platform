import { isIP } from 'node:net';
import { loadSentryConfig } from './sentry-config.js';
import type { SentryConfig } from './sentry-config.js';

export type RuntimeEnvironment = 'development' | 'test' | 'production';
export type RuntimeLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';

export interface RuntimeConfig {
  readonly service: string;
  readonly environment: RuntimeEnvironment;
  readonly host: string;
  readonly port: number;
  readonly logLevel: RuntimeLogLevel;
  readonly sentry: SentryConfig;
  readonly docsEnabled: boolean;
  readonly corsOrigins: readonly string[];
}

export interface RuntimeDefinition {
  readonly service: string;
  readonly envPrefix: string;
  readonly defaultPort: number;
}

export type ServiceConfig = Pick<RuntimeConfig, 'service' | 'environment' | 'logLevel' | 'sentry'>;

export function loadServiceConfig(
  env: NodeJS.ProcessEnv,
  definition: Pick<RuntimeDefinition, 'service' | 'envPrefix'>,
): ServiceConfig {
  const environment = env['NODE_ENV'] ?? 'development';
  if (!environments.has(environment as RuntimeEnvironment)) {
    throw new Error('Invalid NODE_ENV: expected development, test or production.');
  }
  const logLevel = env[`${definition.envPrefix}_LOG_LEVEL`] ?? 'info';
  if (!logLevels.has(logLevel as RuntimeLogLevel)) {
    throw new Error(
      `Invalid ${definition.envPrefix}_LOG_LEVEL: expected trace, debug, info, warn, error, fatal or silent.`,
    );
  }
  return Object.freeze({
    service: definition.service,
    environment: environment as RuntimeEnvironment,
    logLevel: logLevel as RuntimeLogLevel,
    sentry: loadSentryConfig(env, definition.envPrefix),
  });
}

const environments = new Set<RuntimeEnvironment>(['development', 'test', 'production']);
const logLevels = new Set<RuntimeLogLevel>(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']);

/** Validate configuration once at startup. Error messages never include environment values. */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv, definition: RuntimeDefinition): RuntimeConfig {
  const service = loadServiceConfig(env, definition);
  const { environment } = service;
  const prefix = definition.envPrefix;

  const host = env[`${prefix}_HOST`] ?? '127.0.0.1';
  const isHostname =
    host.length <= 253 &&
    host.split('.').every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/iu.test(label));
  if (!isIP(host) && !isHostname) {
    throw new Error(`Invalid ${prefix}_HOST: expected a hostname or IP address.`);
  }

  const portValue = env[`${prefix}_PORT`] ?? String(definition.defaultPort);
  if (!/^\d+$/u.test(portValue)) {
    throw new Error(`Invalid ${prefix}_PORT: expected an integer between 1 and 65535.`);
  }
  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${prefix}_PORT: expected an integer between 1 and 65535.`);
  }

  const docsValue = env[`${prefix}_DOCS_ENABLED`];
  if (docsValue !== undefined && docsValue !== 'true' && docsValue !== 'false') {
    throw new Error(`Invalid ${prefix}_DOCS_ENABLED: expected true or false.`);
  }

  return Object.freeze({
    ...service,
    host,
    port,
    docsEnabled: docsValue === undefined ? environment !== 'production' : docsValue === 'true',
    corsOrigins: Object.freeze(parseCorsOrigins(env[`${prefix}_CORS_ORIGINS`], prefix)),
  });
}

function parseCorsOrigins(value: string | undefined, prefix: string): string[] {
  if (value === undefined || value.trim() === '') return [];

  return [
    ...new Set(
      value.split(',').map((entry) => {
        const origin = entry.trim();
        const invalid = () =>
          new Error(
            `Invalid ${prefix}_CORS_ORIGINS: expected comma-separated HTTP(S) origins without paths, credentials or wildcards.`,
          );
        if (!/^https?:\/\/[^/?#]+\/?$/iu.test(origin) || /[\s\\*@]/u.test(origin)) throw invalid();

        let url: URL;
        try {
          url = new URL(origin);
        } catch {
          throw invalid();
        }

        if (
          (url.protocol !== 'http:' && url.protocol !== 'https:') ||
          url.username !== '' ||
          url.password !== '' ||
          url.pathname !== '/' ||
          url.search !== '' ||
          url.hash !== ''
        ) {
          throw invalid();
        }
        return url.origin;
      }),
    ),
  ];
}
