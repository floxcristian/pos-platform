const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const nx = require('@nx/eslint-plugin');
const posUi = require('./tools/eslint/pos-ui-contracts.cjs');
const posQuality = require('./tools/eslint/pos-code-quality.cjs');
const { builtinModules } = require('node:module');

const backendRoots = [
  'apps/pos-runtime',
  'apps/country-api',
  'apps/pos-sync-worker',
  'apps/erp-worker',
  'libs/backend',
  'libs/platform/backend',
];
const universalRoots = ['libs/contracts', 'libs/shared-kernel', 'libs/country-policies'];
const typedFiles = [...backendRoots, ...universalRoots].map((root) => `${root}/**/*.{ts,mts}`);
const backendSources = backendRoots.map((root) => `${root}/src/**/*.ts`);
// A context is itself a project under libs/backend/<context>.
backendSources.push('libs/backend/*/src/**/*.ts');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.nx/**', 'coverage/**', '**/target/**', 'apps/pos-docs/.astro/**'] },
  { linterOptions: { reportUnusedDisableDirectives: 'error', reportUnusedInlineConfigs: 'error' } },
  {
    files: ['**/*.{ts,mts}'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: { 'pos-quality': posQuality },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'all', argsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'error',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: typedFiles,
    // Exceptions belong in reviewed, narrowly scoped configuration rather than source comments.
    linterOptions: { noInlineConfig: true },
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.backend.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': [
        'error',
        // FastifyReply is a fluent thenable: awaiting header() waits for a response
        // that has not been sent. Promise-returning work still requires handling.
        { ignoreVoid: false, ignoreIIFE: false },
      ],
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      '@typescript-eslint/return-await': ['error', 'error-handling-correctness-only'],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': 'error',
    },
  },
  {
    files: backendSources,
    ignores: [
      '**/src/main.ts',
      '**/src/instrument.ts',
      '**/src/config/**/*.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Load and validate the environment in configuration; inject its immutable snapshot.',
        },
      ],
    },
  },
  {
    files: [
      'apps/pos-runtime/src/**/*.ts',
      'apps/country-api/src/**/*.ts',
      'apps/pos-sync-worker/src/**/*.ts',
      'apps/erp-worker/src/**/*.ts',
      'libs/backend/*/src/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: ['Logger'],
              message: 'Inject PinoLogger from nestjs-pino; observability setup belongs to platform/backend.',
            },
            { name: 'pino', message: 'Configure the shared logger in platform/backend.' },
            { name: 'pino-http', message: 'Configure HTTP logging in platform/backend.' },
          ],
          patterns: [
            { group: ['@sentry/*'], message: 'Use the telemetry boundary exposed by platform/backend.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/pos-web/src/main.ts'],
    rules: {
      // Angular has no injectable logger until bootstrap succeeds.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['**/*.{spec,test}.ts', '**/*.{spec,test}.mts'],
    rules: {
      'pos-quality/no-focused-or-skipped-tests': 'error',
    },
  },
  {
    files: ['apps/pos-web/**/*.ts', 'libs/data-access/**/*.ts', 'libs/ui/**/*.ts', 'libs/features/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: { '@angular-eslint/prefer-on-push-component-change-detection': 'error' },
  },
  {
    files: [
      'apps/pos-web/src/**/*.ts',
      'libs/domain/src/**/*.ts',
      'libs/data-access/src/**/*.ts',
      'libs/ui/src/**/*.ts',
      'libs/features/**/*.ts',
      'libs/contracts/src/**/*.ts',
      'libs/shared-kernel/src/**/*.ts',
      'libs/country-policies/src/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: builtinModules.map((name) => ({
            name,
            message: 'Node APIs belong to server adapters, not browser or universal libraries.',
          })),
          patterns: [
            {
              group: ['node:*'],
              message: 'Node APIs belong to server adapters, not browser or universal libraries.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints: [
            { sourceTag: 'type:docs', onlyDependOnLibsWithTags: [] },
            {
              sourceTag: 'env:browser',
              onlyDependOnLibsWithTags: ['env:browser', 'env:universal'],
              bannedExternalImports: [
                '@nestjs/*',
                '@sentry/*',
                'fastify',
                'pino',
                'pino-http',
                'pg',
                'mongodb',
              ],
            },
            {
              sourceTag: 'env:server',
              onlyDependOnLibsWithTags: ['env:server', 'env:universal'],
              bannedExternalImports: ['@angular/*', 'primeng', 'primeng/*', '@tauri-apps/*'],
            },
            {
              sourceTag: 'env:universal',
              onlyDependOnLibsWithTags: ['env:universal'],
              allowedExternalImports: ['vitest'],
            },
            {
              sourceTag: 'type:backend',
              bannedExternalImports: ['@sentry/*', 'pino', 'pino-http'],
              onlyDependOnLibsWithTags: [
                'type:backend-module',
                'type:platform',
                'type:policy',
                'type:contract',
                'type:kernel',
              ],
            },
            {
              sourceTag: 'type:backend-module',
              bannedExternalImports: ['@sentry/*', 'pino', 'pino-http'],
              onlyDependOnLibsWithTags: ['type:platform', 'type:policy', 'type:contract', 'type:kernel'],
            },
            { sourceTag: 'type:platform', onlyDependOnLibsWithTags: ['type:contract', 'type:kernel'] },
            { sourceTag: 'type:policy', onlyDependOnLibsWithTags: ['type:kernel'] },
            { sourceTag: 'type:contract', onlyDependOnLibsWithTags: ['type:kernel'] },
            { sourceTag: 'type:kernel', onlyDependOnLibsWithTags: [] },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:domain',
                'type:data-access',
                'type:ui',
                'type:contract',
                'type:kernel',
              ],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
              allowedExternalImports: ['vitest'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:domain', 'type:data-access', 'type:contract', 'type:kernel'],
            },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:domain'] },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:domain',
                'type:data-access',
                'type:ui',
                'type:contract',
                'type:kernel',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    plugins: { 'pos-ui': posUi },
    rules: {
      'pos-ui/icon-button-tooltip': 'error',
      'pos-ui/no-secondary-outlined-button': 'error',
      'pos-ui/no-labeled-secondary-text-button': 'error',
    },
  },
);
