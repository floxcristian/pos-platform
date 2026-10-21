import { Injectable, Module } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { inspectWorker, loadServiceConfig, parseWorkerCommand, ServiceConfigService } from '../src/index.js';

let closed = 0;
let injectedService: string | undefined;

@Injectable()
class WorkerProbe implements OnApplicationShutdown {
  constructor(config: ServiceConfigService) {
    injectedService = config.value.service;
  }
  onApplicationShutdown(): void {
    closed += 1;
  }
}

@Module({ providers: [WorkerProbe] })
class ProbeModule {}

describe('worker scaffold lifecycle', () => {
  beforeEach(() => {
    closed = 0;
    injectedService = undefined;
  });

  it('inspects its actual module graph and closes initialized resources', async () => {
    const result = await inspectWorker(
      ProbeModule,
      loadServiceConfig(
        { NODE_ENV: 'test', TEST_WORKER_LOG_LEVEL: 'silent' },
        { service: 'test-worker', envPrefix: 'TEST_WORKER' },
      ),
    );
    expect(result).toMatchObject({ service: 'test-worker', mode: 'scaffold', processingEnabled: false });
    expect(result.modules).toContain('ProbeModule');
    expect(injectedService).toBe('test-worker');
    expect(closed).toBe(1);
  });

  it('accepts only inspection commands and never interprets start as enabled processing', () => {
    expect(parseWorkerCommand([])).toBe('inspect');
    expect(parseWorkerCommand(['inspect'])).toBe('inspect');
    expect(parseWorkerCommand(['check'])).toBe('check');
    expect(() => parseWorkerCommand(['start'])).toThrow(/inspect or check/);
    expect(() => parseWorkerCommand(['inspect', '--process'])).toThrow(/inspect or check/);
  });
});
