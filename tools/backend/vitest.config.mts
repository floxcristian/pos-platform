import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const workspace = fileURLToPath(new URL('../../', import.meta.url));
const paths = (
  JSON.parse(readFileSync(resolve(workspace, 'tsconfig.base.json'), 'utf8')) as {
    compilerOptions: { paths: Record<string, string[]> };
  }
).compilerOptions.paths;

export function createBackendVitestConfig(configUrl: string) {
  return defineConfig({
    root: fileURLToPath(new URL('.', configUrl)),
    resolve: {
      alias: Object.entries(paths).map(([find, [target]]) => ({
        find,
        replacement: resolve(workspace, target),
      })),
    },
    plugins: [
      swc.vite({
        module: { type: 'es6' },
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          keepClassNames: true,
        },
      }),
    ],
    test: {
      include: ['test/**/*.test.ts'],
      environment: 'node',
      globals: false,
      pool: 'forks',
      setupFiles: [resolve(workspace, 'tools/backend/test-setup.ts')],
      restoreMocks: true,
      clearMocks: true,
      passWithNoTests: false,
      testTimeout: 10_000,
      hookTimeout: 30_000,
    },
  });
}
