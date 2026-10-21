import { Global, Inject, Injectable, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import type { RuntimeConfig } from './runtime-config.js';
import { ServiceConfigModule } from './service-config.module.js';

const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');

@Injectable()
export class RuntimeConfigService {
  constructor(@Inject(RUNTIME_CONFIG) readonly value: RuntimeConfig) {}
}

@Global()
@Module({})
export class RuntimeConfigModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: RuntimeConfigModule,
      imports: [ServiceConfigModule.register(config)],
      providers: [{ provide: RUNTIME_CONFIG, useValue: config }, RuntimeConfigService],
      exports: [RuntimeConfigService],
    };
  }
}
