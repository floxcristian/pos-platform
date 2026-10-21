import pino from 'pino';

export function reportStartupFailure(service: string): void {
  pino({ base: { service, context: 'Bootstrap' } }).fatal({
    event: 'application.start.failed',
    message: 'Application failed to start. Check its configuration and composition.',
  });
  process.exitCode = 1;
}
