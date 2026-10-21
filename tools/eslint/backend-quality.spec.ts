import { fileURLToPath } from 'node:url';
import { createProjectGraphAsync } from '@nx/devkit';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const workspace = fileURLToPath(new URL('../../', import.meta.url));
const sourceFile = 'libs/backend/sales/src/lib/sales.module.ts';
const testFile = 'apps/branch-api/test/http.test.ts';
let eslint: ESLint;

async function check(source: string, filePath = sourceFile) {
  const [result] = await eslint.lintText(source, { filePath });
  expect(result).toBeDefined();
  expect(result.fatalErrorCount).toBe(0);
  return result.messages;
}

beforeAll(async () => {
  // Each lintText call replaces a file's contents. CI's single-run inference
  // would treat subsequent snippets as autofixes and discard dependency types.
  vi.stubEnv('TSESTREE_SINGLE_RUN', 'false');
  vi.stubEnv('NX_DAEMON', 'false');
  vi.stubEnv('NX_ISOLATE_PLUGINS', 'false');
  vi.stubEnv('NX_INTERACTIVE', 'false');
  await createProjectGraphAsync({ exitOnError: false });
  eslint = new ESLint({ cwd: workspace });
  // Warm the real TypeScript program once; every snippet uses an existing file
  // from the lint project, with no mocked parser, types or lint configuration.
  expect(await check('export {};')).toEqual([]);
}, 120_000);

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('backend type-aware quality gates', () => {
  it.each([
    ['Promise.resolve();', '@typescript-eslint/no-floating-promises'],
    ['void Promise.resolve();', '@typescript-eslint/no-floating-promises'],
    [
      '[1].forEach(async (value) => { await Promise.resolve(value); });',
      '@typescript-eslint/no-misused-promises',
    ],
    [
      'export async function read(): Promise<number> { return await 1; }',
      '@typescript-eslint/await-thenable',
    ],
    [
      'const payload = JSON.parse("{}"); export const amount: number = payload.amount;',
      '@typescript-eslint/no-unsafe-member-access',
    ],
    [
      'export function read(input: string): object { return JSON.parse(input); }',
      '@typescript-eslint/no-unsafe-return',
    ],
    ['export function fail(): never { throw "failed"; }', '@typescript-eslint/only-throw-error'],
    ['Promise.reject("failed").catch(() => undefined);', '@typescript-eslint/prefer-promise-reject-errors'],
    [
      'export async function read(): Promise<number> { try { return Promise.resolve(1); } catch { return 0; } }',
      '@typescript-eslint/return-await',
    ],
  ])('rejects unsafe code: %s', async (source, rule) => {
    expect((await check(source)).map((message) => message.ruleId)).toContain(rule);
  });

  it('requires handling rejected promises in tests too', async () => {
    const source = `import { it } from 'vitest';
      it('persists the operation', () => { Promise.resolve(); });`;
    expect((await check(source, testFile)).map((message) => message.ruleId)).toContain(
      '@typescript-eslint/no-floating-promises',
    );
  });

  it('accepts awaited concurrent work and explicit rejection handling', async () => {
    expect(
      await check(`export async function execute(): Promise<number[]> {
        return await Promise.all([1, 2].map((value) => Promise.resolve(value)));
      }
      execute().catch((error: unknown) => {
        if (error instanceof Error) return error.message;
        return 'Unexpected failure';
      });`),
    ).toEqual([]);
  });

  it('accepts untrusted input only after narrowing unknown', async () => {
    expect(
      await check(`export function read(input: string): number {
        const value: unknown = JSON.parse(input);
        if (typeof value === 'object' && value !== null &&
            'amount' in value && typeof value.amount === 'number') return value.amount;
        throw new Error('Invalid amount');
      }`),
    ).toEqual([]);
  });

  it('preserves Fastify fluent response configuration without waiting for response completion', async () => {
    expect(
      await check(
        `import type { FastifyReply } from 'fastify';
        export function correlate(reply: FastifyReply, id: string): void {
          reply.header('x-request-id', id);
        }`,
        'libs/platform/backend/src/common/observability/runtime-logging.ts',
      ),
    ).toEqual([]);
  });
});

describe('backend observability and configuration boundaries', () => {
  it.each([
    ["console.info('operation completed');", 'no-console'],
    ["export const host = process.env['HOST'];", 'no-restricted-properties'],
    ["export { default } from 'pino';", 'no-restricted-imports'],
    ["export { Logger } from '@nestjs/common';", 'no-restricted-imports'],
  ])('rejects bypassing shared infrastructure: %s', async (source, rule) => {
    expect((await check(source)).map((message) => message.ruleId)).toContain(rule);
  });

  it('allows injection of the request-aware logger', async () => {
    expect(
      await check(`import { PinoLogger } from 'nestjs-pino';
        export class OperationAudit {
          constructor(private readonly logger: PinoLogger) {}
          record(): void { this.logger.info({ event: 'operation.completed' }); }
        }`),
    ).toEqual([]);
  });

  it('also rejects loading the logger SDK through a dynamic import in business code', async () => {
    const messages = await check("export async function load() { return import('pino'); }");
    expect(messages.map((message) => message.ruleId)).toContain('@nx/enforce-module-boundaries');
  });

  it('allows reading the environment at the application entrypoint', async () => {
    expect(
      await check("export const environment = process.env['NODE_ENV'];", 'apps/branch-api/src/main.ts'),
    ).toEqual([]);
  });
});

describe('reviewable verification controls', () => {
  it.each(['// @ts-ignore', '// @ts-nocheck', '// @ts-expect-error'])('rejects %s', async (directive) => {
    expect((await check(`${directive}\nexport const value = 1;`)).map((message) => message.ruleId)).toContain(
      '@typescript-eslint/ban-ts-comment',
    );
  });

  it('allows an explained expected compiler error', async () => {
    expect(
      await check(
        "// @ts-expect-error -- Exercise the documented incompatible type.\nexport const value: number = 'invalid';",
      ),
    ).toEqual([]);
  });

  it('does not let inline directives silence a backend violation', async () => {
    const messages = await check("/* eslint-disable */\nconsole.log('unsafe');");
    expect(messages.map((message) => message.ruleId)).toContain('no-console');
    expect(messages.some((message) => message.message.includes('noInlineConfig'))).toBe(true);
  });

  it.each([
    "import { it as scenario } from 'vitest'; scenario.only('focused', () => {});",
    "import { test } from 'vitest'; test['skip']('disabled', () => {});",
    "import * as suite from 'vitest'; suite.describe.only('focused', () => {});",
  ])('rejects focused or skipped tests: %s', async (source) => {
    expect((await check(source, testFile)).map((message) => message.ruleId)).toContain(
      'pos-quality/no-focused-or-skipped-tests',
    );
  });

  it('allows complete tests and unrelated skip properties', async () => {
    expect(
      await check(
        `import { it, expect } from 'vitest';
      it('checks pagination', () => {
        const pagination = { skip: 2 };
        expect(pagination.skip).toBe(2);
      });`,
        testFile,
      ),
    ).toEqual([]);
  });
});
