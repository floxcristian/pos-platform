import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@corporate-pos/domain': fileURLToPath(new URL('./libs/domain/src/index.ts', import.meta.url)),
      '@corporate-pos/data-access': fileURLToPath(
        new URL('./libs/data-access/src/index.ts', import.meta.url),
      ),
    },
  },
  test: { include: ['libs/**/*.spec.ts', 'libs/**/*.test.ts'], environment: 'node', restoreMocks: true },
});
