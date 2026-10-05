import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import { defineConfig } from 'eslint/config';

const $globals = {
  ...globals.browser,
  AudioWorkletGlobalScope: false,
};

// @ts-expect-error: Unable to assign to read only property
delete $globals['AudioWorkletGlobalScope '];

export default defineConfig([
  {
    // Globs are prefixed with '**/' so they match in every workspace project: eslint runs per-project
    // from libs/* and apps/*. Build output, reports and the files the build generates are not linted.
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/.astro/**',
      '**/public/pagefind/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/e2e/.harness/**',
      '**/src/getWorkerTemplate.ts',
      '**/src/getDefineWorkerTemplate.ts',
      // CommonJS fixtures loaded by node worker threads in the unit tests
      '**/__test__/**/*.js',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: $globals,
    },
    rules: {
      // forbid describe.only, it.only, test.only
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'CallExpression[callee.object.name="describe"][callee.property.name="only"], ' +
            'CallExpression[callee.object.name="it"][callee.property.name="only"], ' +
            'CallExpression[callee.object.name="test"][callee.property.name="only"]',
          message: 'Remove .only from tests before committing.',
        },
      ],
    },
  },
  {
    // Node-run config files and build/test scripts
    files: ['**/*.js', '**/*.cjs', '**/*.config.{js,cjs,mjs,ts,mts}', '**/scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Code that runs inside a Worker
    files: ['**/*.worker.{js,ts}'],
    languageOptions: { globals: { ...globals.worker } },
  },
  tseslint.configs.recommended,
  {
    // An underscore prefix marks an intentionally unused argument. Unused local variables are still
    // reported. A caught error that goes unused is allowed.
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    // A Worker file declares `const worker = defineWorker(...)` only to export its type: the value is
    // registered by the call itself. That is the documented pattern, not dead code.
    files: ['**/*.worker.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^worker$', caughtErrors: 'none' }],
    },
  },
  {
    // The public types of the package are generic plumbing over values it knows nothing about, so
    // `any`, `Function` and `{}` are the honest types in a few positions. Changing them would change
    // the published API.
    files: ['libs/easy-web-worker/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // Tests reach into internals, mock globals and block threads on purpose.
    files: ['**/__test__/**', '**/e2e/**', '**/visual/**', '**/*.{test,spec}.{ts,tsx}', '**/vitest.setup.ts', '**/scripts/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'off',
    },
  },
  {
    // Type-only assertions: values are declared to be inspected by the compiler, never to be used.
    files: ['**/__test__/types/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    // The website uses the modern JSX transform, so components do not import React.
    files: ['apps/**/*.{ts,tsx}'],
    extends: [pluginReact.configs.flat.recommended],
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      // UI copy contains quotes and apostrophes; escaping them adds noise for no benefit.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // apps/website is Tailwind-only. `ignore` lists the classes that exist on purpose outside Tailwind:
    // the ones defined in src/styles and the hooks the tests select by.
    // .astro is excluded because this config has no Astro parser.
    files: ['apps/website/src/**/*.tsx'],
    plugins: { 'better-tailwindcss': betterTailwind },
    settings: {
      'better-tailwindcss': { entryPoint: 'src/styles/app.css' },
    },
    rules: {
      'better-tailwindcss/no-unknown-classes': [
        'error',
        {
          ignore: [
            // src/styles/components.css and docs.css
            '^doc-content$',
            '^doc-diagram$',
            '^code-block$',
            '^code-head$',
            '^copy-button$',
            '^line$',
            '^symptom$',
            '^toast$',
            '^show$',
            '^drawer$',
            '^search-dialog$',
            '^install$',
            '^site-footer$',
            '^workbench(-source)?$',
            // src/examples/shared/demo.css
            '^demo(-[a-z]+)*(--[a-z]+)?$',
            '^segmented$',
            '^(empty|late|newest)$',
          ],
        },
      ],
      'better-tailwindcss/enforce-consistent-class-order': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
    },
  },
]);
