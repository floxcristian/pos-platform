export interface SentryConfig {
  readonly enabled: boolean;
  readonly dsn?: string;
  readonly release?: string;
  readonly shutdownTimeoutMs: number;
}

/** Explicit opt-in; validation errors never contain configuration values. */
export function loadSentryConfig(env: NodeJS.ProcessEnv, prefix: string): SentryConfig {
  const enabledValue = env[`${prefix}_SENTRY_ENABLED`] ?? 'false';
  if (enabledValue !== 'true' && enabledValue !== 'false') {
    throw new Error(`Invalid ${prefix}_SENTRY_ENABLED: expected true or false.`);
  }
  const dsn = env[`${prefix}_SENTRY_DSN`]?.trim() || undefined;
  if (dsn) {
    let valid = false;
    try {
      const url = new URL(dsn);
      valid =
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        /^[a-z\d]+$/iu.test(url.username) &&
        url.password === '' &&
        url.search === '' &&
        url.hash === '' &&
        !/[\s\\]/u.test(dsn) &&
        /^\/(?:[a-z\d._~-]+\/)*\d+\/?$/iu.test(url.pathname);
    } catch {
      // Report the field, never the DSN or parser message.
    }
    if (!valid) throw new Error(`Invalid ${prefix}_SENTRY_DSN: expected a public HTTP(S) Sentry DSN.`);
  }
  if (enabledValue === 'true' && !dsn) {
    throw new Error(`Invalid ${prefix}_SENTRY_DSN: required when Sentry is enabled.`);
  }
  const release = env[`${prefix}_SENTRY_RELEASE`]?.trim() || undefined;
  if (release && !/^[a-z\d][a-z\d._+-]{0,127}$/iu.test(release)) {
    throw new Error(`Invalid ${prefix}_SENTRY_RELEASE: expected a version or build identifier.`);
  }
  const timeoutValue = env[`${prefix}_SENTRY_SHUTDOWN_TIMEOUT_MS`] ?? '2000';
  const shutdownTimeoutMs = Number(timeoutValue);
  if (
    !/^\d+$/u.test(timeoutValue) ||
    !Number.isSafeInteger(shutdownTimeoutMs) ||
    shutdownTimeoutMs < 1 ||
    shutdownTimeoutMs > 10_000
  ) {
    throw new Error(`Invalid ${prefix}_SENTRY_SHUTDOWN_TIMEOUT_MS: expected an integer between 1 and 10000.`);
  }
  return Object.freeze({ enabled: enabledValue === 'true', dsn, release, shutdownTimeoutMs });
}
