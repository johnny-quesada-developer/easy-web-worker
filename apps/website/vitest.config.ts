import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const packageDist = here('../../libs/easy-web-worker/dist');

// Same aliases as astro.config.mjs: tests execute the exact snippets and examples the site displays,
// against the built package (libs/easy-web-worker/dist).
export default defineConfig({
  // Astro exposes PUBLIC_* variables from .env; mirror that so src/lib/site.ts works in tests.
  envPrefix: 'PUBLIC_',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@snippets\/(.*)$/, replacement: `${here('./src/snippets')}/$1` },
      { find: /^@examples\/(.*)$/, replacement: `${here('./src/examples')}/$1` },
      { find: /^easy-web-worker\/(.*)$/, replacement: `${packageDist}/$1.mjs` },
      { find: /^easy-web-worker$/, replacement: `${packageDist}/bundle.mjs` },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: ['dot'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
