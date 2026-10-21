import { Global, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { SentryErrorReporter } from './sentry-error-reporter.js';

@Global()
@Module({})
export class ErrorTrackingModule {
  static register(reporter: SentryErrorReporter): DynamicModule {
    return {
      module: ErrorTrackingModule,
      providers: [{ provide: SentryErrorReporter, useValue: reporter }],
      exports: [SentryErrorReporter],
    };
  }
}
