import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@pos-platform/domain': fileURLToPath(new URL('./libs/domain/src/index.ts', import.meta.url)),
      '@pos-platform/data-access': fileURLToPath(new URL('./libs/data-access/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['libs/**/*.spec.ts', 'libs/**/*.test.ts', 'tools/**/*.spec.ts', 'tools/**/*.spec.mjs'],
    exclude: [...configDefaults.exclude, 'libs/backend/**', 'libs/platform/**'],
    environment: 'node',
    restoreMocks: true,
  },
});
