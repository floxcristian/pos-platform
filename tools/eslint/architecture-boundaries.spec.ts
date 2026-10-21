import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createProjectGraphAsync } from '@nx/devkit';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const workspace = fileURLToPath(new URL('../../', import.meta.url));
const rule = '@nx/enforce-module-boundaries';
let eslint: ESLint;
let aliases: Record<string, string[]>;

// Resolve the public import from the real workspace instead of maintaining a
// second alias map in tests. No temporary projects or mocked Nx graph are used.
function publicImport(projectRoot: string): string {
  const entry = Object.entries(aliases).find(([, paths]) =>
    paths.some((path) => path === `${projectRoot}/src/index.ts`),
  );
  if (!entry) throw new Error(`No public import is configured for ${projectRoot}`);
  return entry[0];
}

async function checkImport(filePath: string, target: string, typeOnly = false) {
  const [result] = await eslint.lintText(`export ${typeOnly ? 'type ' : ''}* from '${target}';`, {
    filePath,
  });
  expect(result, `${filePath} must be checked by the real ESLint configuration`).toBeDefined();
  expect(result.fatalErrorCount).toBe(0);
  expect(result.messages.filter((message) => message.ruleId === null)).toEqual([]);
  return result.messages;
}

beforeAll(async () => {
  // Each lintText call replaces a file's contents. CI's single-run inference
  // would treat subsequent snippets as autofixes and discard dependency types.
  vi.stubEnv('TSESTREE_SINGLE_RUN', 'false');
  vi.stubEnv('NX_DAEMON', 'false');
  vi.stubEnv('NX_ISOLATE_PLUGINS', 'false');
  vi.stubEnv('NX_INTERACTIVE', 'false');
  // The Nx lint rule otherwise skips enforcement in a fresh checkout with no
  // cached project graph. Build the actual graph before exercising the rule.
  await createProjectGraphAsync({ exitOnError: false });
  aliases = JSON.parse(readFileSync(new URL('../../tsconfig.base.json', import.meta.url), 'utf8'))
    .compilerOptions.paths as Record<string, string[]>;
  eslint = new ESLint({ cwd: workspace });
  // ESLint loads the Angular/Nx plugins lazily; include cold configuration
  // loading in integration setup instead of the first boundary assertion.
  await eslint.calculateConfigForFile('apps/pos-runtime/src/main.ts');
  await eslint.lintText('export {};', { filePath: 'apps/pos-runtime/src/main.ts' });
}, 120_000);

afterAll(() => {
  vi.unstubAllEnvs();
});

// Rejected cross-runtime imports still make TypeScript resolve Angular's types.
// These are compiler-backed integration checks rather than isolated rule tests.
describe('Nx architecture boundaries', { timeout: 30_000 }, () => {
  it('rejects frontend dependencies from the runtime', async () => {
    const messages = await checkImport('apps/pos-runtime/src/main.ts', publicImport('libs/ui'));
    expect(messages.map((message) => message.ruleId)).toContain(rule);
  });

  it('rejects backend dependencies from a frontend feature', async () => {
    const messages = await checkImport(
      'libs/features/checkout/src/index.ts',
      publicImport('libs/backend/sales'),
    );
    expect(messages.map((message) => message.ruleId)).toContain(rule);
  });

  it.each(['apps/pos-desktop/src/main.ts', 'apps/pos-mobile/src/main.ts'])(
    'allows each client to compose the shared shell: %s',
    async (filePath) => {
      expect(await checkImport(filePath, publicImport('libs/client-shell'))).toEqual([]);
    },
  );

  it.each([
    ['libs/client-shell/src/index.ts', '@capacitor/core'],
    ['libs/client-shell/src/index.ts', '@tauri-apps/api'],
    ['libs/features/checkout/src/index.ts', '@capacitor/app'],
    ['libs/data-access/src/index.ts', '@tauri-apps/api'],
    ['libs/ui/src/index.ts', '@capacitor/core'],
    ['apps/pos-desktop/src/main.ts', '@capacitor/core'],
    ['apps/pos-mobile/src/main.ts', '@tauri-apps/api'],
  ])('keeps native SDKs inside their platform: %s → %s', async (filePath, target) => {
    const messages = await checkImport(filePath, target);
    expect(messages.map((message) => message.messageId)).toContain('bannedExternalImportsViolation');
  });

  it('keeps universal contracts independent of Nest', async () => {
    const messages = await checkImport('libs/contracts/src/index.ts', '@nestjs/common', true);
    expect(messages.map((message) => message.messageId)).toContain('bannedExternalImportsViolation');
  });

  it.each([
    ['libs/backend/sales/src/index.ts', '@angular/core'],
    ['libs/features/checkout/src/index.ts', '@nestjs/common'],
  ])('rejects importing the wrong runtime framework from %s', async (filePath, dependency) => {
    const messages = await checkImport(filePath, dependency);
    expect(messages.map((message) => message.messageId)).toContain('bannedExternalImportsViolation');
  });

  it.each([
    ['libs/contracts/src/index.ts', 'node:fs'],
    ['libs/features/checkout/src/index.ts', 'fs'],
  ])('rejects Node builtins from %s', async (filePath, dependency) => {
    const messages = await checkImport(filePath, dependency);
    expect(messages.map((message) => message.ruleId)).toContain('no-restricted-imports');
  });

  it('rejects a direct dependency between business modules', async () => {
    const messages = await checkImport(
      'libs/backend/sales/src/index.ts',
      publicImport('libs/backend/payments'),
    );
    expect(messages.map((message) => message.messageId)).toContain('onlyTagsConstraintViolation');
  });

  it('rejects relative access into another business module', async () => {
    const messages = await checkImport(
      'libs/backend/sales/src/index.ts',
      '../../payments/src/lib/payments.module',
    );
    expect(messages.map((message) => message.messageId)).toContain(
      'noRelativeOrAbsoluteImportsAcrossLibraries',
    );
  });

  it.each(['libs/backend/sales/src/index.ts', 'libs/features/checkout/src/index.ts'])(
    'allows shared contract types from %s',
    async (filePath) => {
      expect(await checkImport(filePath, publicImport('libs/contracts'), true)).toEqual([]);
    },
  );

  it.each(['libs/backend/sales', 'libs/backend/payments', 'libs/platform/backend'])(
    'allows the runtime composition root to assemble %s',
    async (projectRoot) => {
      expect(await checkImport('apps/pos-runtime/src/main.ts', publicImport(projectRoot))).toEqual([]);
    },
  );

  it.each(['libs/domain', 'libs/data-access', 'libs/ui'])(
    'preserves frontend feature access to %s',
    async (projectRoot) => {
      expect(await checkImport('libs/features/checkout/src/index.ts', publicImport(projectRoot))).toEqual([]);
    },
  );
});
