import { defaultStackParser } from '@sentry/node';
import type { ErrorEvent, StackFrame } from '@sentry/node';
import type { ServiceConfig } from '../../config/runtime-config.js';

export type FailurePhase = 'http' | 'startup' | 'worker';
export const FAILURE_CODES = new Set([
  'INTERNAL_ERROR',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'HTTP_ERROR',
  'APPLICATION_START_FAILED',
  'WORKER_EXECUTION_FAILED',
]);
export const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/iu;

const descriptions = {
  http: { type: 'HttpServerFailure', value: 'An unexpected HTTP server failure occurred.' },
  startup: { type: 'ApplicationStartupFailure', value: 'The application failed to start.' },
  worker: { type: 'WorkerExecutionFailure', value: 'A worker operation failed.' },
} as const;

export function safeStackFrames(error: unknown): StackFrame[] {
  if (!(error instanceof Error) || typeof error.stack !== 'string') return [];
  return sanitizeFrames(defaultStackParser(error.stack));
}

function sanitizeFrames(frames: readonly StackFrame[]): StackFrame[] {
  return frames.slice(-40).flatMap((frame) => {
    const filename = frame.filename?.replace(/\\/gu, '/').split(/[?#]/u)[0].split('/').at(-1);
    if (!filename || !/^[a-z\d_.-]{1,96}\.[cm]?[jt]sx?$/iu.test(filename)) return [];
    if (!Number.isSafeInteger(frame.lineno) || (frame.lineno ?? 0) < 1) return [];
    return [
      {
        filename,
        lineno: frame.lineno,
        ...(Number.isSafeInteger(frame.colno) && (frame.colno ?? 0) > 0 ? { colno: frame.colno } : {}),
      },
    ];
  });
}

/** Final allowlist after SDK enrichment; no request, global scope or arbitrary exception data survives. */
export function sanitizeSentryEvent(event: ErrorEvent, config: ServiceConfig): ErrorEvent | null {
  const phase = event.tags?.['phase'];
  const code = event.tags?.['code'];
  const requestId = event.tags?.['requestId'];
  if (
    (phase !== 'http' && phase !== 'startup' && phase !== 'worker') ||
    typeof code !== 'string' ||
    !FAILURE_CODES.has(code)
  )
    return null;
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return null;
  const statusCode = Number(event.tags?.['statusCode']);
  const frames = sanitizeFrames(event.exception?.values?.[0]?.stacktrace?.frames ?? []);
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: 'node',
    level: phase === 'startup' ? 'fatal' : 'error',
    environment: config.environment,
    ...(config.sentry.release ? { release: config.sentry.release } : {}),
    fingerprint: ['{{ default }}', config.service, phase, code],
    tags: {
      service: config.service,
      phase,
      code,
      requestId,
      correlationId: requestId,
      ...(Number.isInteger(statusCode) && statusCode >= 500 && statusCode <= 599 ? { statusCode } : {}),
    },
    exception: {
      values: [
        {
          ...descriptions[phase],
          mechanism: { type: 'pos-platform.boundary', handled: true },
          ...(frames.length > 0 ? { stacktrace: { frames } } : {}),
        },
      ],
    },
  };
}
