import { randomUUID } from 'node:crypto';
import type { OnApplicationShutdown } from '@nestjs/common';
import { NodeClient, Scope, defaultStackParser, makeNodeTransport } from '@sentry/node';
import type { ServiceConfig } from '../../config/runtime-config.js';
import { safeStackFrames, sanitizeSentryEvent, UUID } from './sentry-event.js';
import type { FailurePhase } from './sentry-event.js';

export type SentryTransportFactory = ConstructorParameters<typeof NodeClient>[0]['transport'];
export interface FailureContext {
  readonly phase: FailurePhase;
  readonly code: string;
  readonly requestId?: string;
  readonly statusCode?: number;
}

/** One private SDK client per application. No global SDK initialization or automatic instrumentation. */
export class SentryErrorReporter implements OnApplicationShutdown {
  private readonly client?: NodeClient;
  private readonly scope?: Scope;
  private readonly captured = new WeakSet<object>();
  private closing?: Promise<boolean>;

  constructor(
    private readonly config: ServiceConfig,
    transport: SentryTransportFactory = makeNodeTransport,
  ) {
    if (!config.sentry.enabled) return;
    this.client = new NodeClient({
      dsn: config.sentry.dsn,
      environment: config.environment,
      release: config.sentry.release,
      serverName: config.service,
      transport,
      stackParser: defaultStackParser,
      integrations: [],
      sendDefaultPii: false,
      sendClientReports: false,
      enableLogs: false,
      maxBreadcrumbs: 0,
      shutdownTimeout: config.sentry.shutdownTimeoutMs,
      beforeSend: (event) => sanitizeSentryEvent(event, config),
    });
    this.scope = new Scope();
    this.scope.setClient(this.client);
    this.client.init();
  }

  captureException(error: unknown, context: FailureContext): string | undefined {
    if (!this.scope || this.closing) return undefined;
    if (typeof error === 'object' && error !== null) {
      if (this.captured.has(error)) return undefined;
      this.captured.add(error);
    }
    try {
      const requestId = context.requestId && UUID.test(context.requestId) ? context.requestId : randomUUID();
      return this.scope.captureEvent({
        tags: { phase: context.phase, code: context.code, requestId, statusCode: context.statusCode },
        exception: { values: [{ stacktrace: { frames: safeStackFrames(error) } }] },
      });
    } catch {
      // Error tracking must never replace the original application error.
      return undefined;
    }
  }

  flush(): Promise<boolean> {
    if (this.closing) return this.closing;
    const client = this.client;
    return client
      ? this.bounded(Promise.resolve().then(() => client.flush(this.config.sentry.shutdownTimeoutMs)))
      : Promise.resolve(true);
  }

  close(): Promise<boolean> {
    const client = this.client;
    this.closing ??= client
      ? this.bounded(Promise.resolve().then(() => client.close(this.config.sentry.shutdownTimeoutMs)))
      : Promise.resolve(true);
    return this.closing;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  private bounded(pending: PromiseLike<boolean>): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), this.config.sentry.shutdownTimeoutMs);
      Promise.resolve(pending)
        .then(resolve, () => resolve(false))
        .finally(() => clearTimeout(timer));
    });
  }
}
