import { describe, expect, it } from 'vitest';
import { runWorkerCommand, loadConfig } from '../src/app.js';

describe('erp-worker scaffold', () => {
  it('composes its contexts and exits with processing disabled', async () => {
    const config = loadConfig({ NODE_ENV: 'test', ERP_WORKER_LOG_LEVEL: 'silent' });
    const inspection = await runWorkerCommand(['check'], config);
    expect(inspection).toMatchObject({ service: 'erp-worker', mode: 'scaffold', processingEnabled: false });
    expect(inspection.modules).toEqual(expect.arrayContaining(['ErpModule', 'SyncModule']));
  });
  it('rejects a processing command while durable infrastructure is absent', async () => {
    await expect(runWorkerCommand(['start'], loadConfig({}))).rejects.toThrow(/inspect or check/);
  });
});
