import { Global, Inject, Injectable, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import type { ServiceConfig } from './runtime-config.js';

const SERVICE_CONFIG = Symbol('SERVICE_CONFIG');

@Injectable()
export class ServiceConfigService {
  constructor(@Inject(SERVICE_CONFIG) readonly value: ServiceConfig) {}
}

@Global()
@Module({})
export class ServiceConfigModule {
  static register(config: ServiceConfig): DynamicModule {
    return {
      module: ServiceConfigModule,
      providers: [{ provide: SERVICE_CONFIG, useValue: config }, ServiceConfigService],
      exports: [ServiceConfigService],
    };
  }
}
