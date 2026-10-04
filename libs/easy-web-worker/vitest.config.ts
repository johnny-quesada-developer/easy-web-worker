import { defineConfig } from 'vitest/config';
import path from 'node:path';

// The suite imports the subject under test through the package name `easy-web-worker`.
// EASY_WEB_WORKER_TEST_TARGET picks what that name resolves to:
//   - src  (default): the TypeScript source
//   - dist: the built, publishable package in ./dist (run `yarn build` first)
const target = process.env.EASY_WEB_WORKER_TEST_TARGET === 'dist' ? 'dist' : 'src';

const src = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'dist');

export default defineConfig({
  test: {
    name: `easy-web-worker (${target})`,
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__test__/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/*.ts'],
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    // __test__/fixtures exists as both .ts and .js (the .js copy is for the worker thread)
    extensions: ['.ts', '.mts', '.js', '.mjs', '.json'],
    alias:
      target === 'dist'
        ? [
            // Deep subpaths must be listed before the bare barrel so they win for deep imports.
            { find: /^easy-web-worker\/(.*)$/, replacement: `${dist}/$1.mjs` },
            { find: /^easy-web-worker$/, replacement: `${dist}/bundle.mjs` },
          ]
        : [
            { find: /^easy-web-worker\/(.*)$/, replacement: `${src}/$1` },
            { find: /^easy-web-worker$/, replacement: `${src}/index.ts` },
          ],
  },
});
