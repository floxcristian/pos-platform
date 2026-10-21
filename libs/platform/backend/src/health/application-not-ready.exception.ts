import { ServiceUnavailableException } from '@nestjs/common';

/** Expected during startup/shutdown; remains an HTTP 503 without creating a Sentry incident. */
export class ApplicationNotReadyException extends ServiceUnavailableException {}
