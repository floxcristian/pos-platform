const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const nx = require('@nx/eslint-plugin');
const posUi = require('./tools/eslint/pos-ui-contracts.cjs');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.nx/**', 'coverage/**', '**/target/**'] },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
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
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:domain', 'type:data-access', 'type:ui'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
              allowedExternalImports: ['vitest'],
            },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:domain', 'type:data-access'] },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:domain'] },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:domain', 'type:data-access', 'type:ui'],
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
