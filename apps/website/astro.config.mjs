import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { CSS_VARIABLE_PREFIX, shikiThemes } from './src/lib/code-themes.mjs';
import { unified } from '@astrojs/markdown-remark';
import { rehypeCodeBlocks, rehypeSymptoms, rehypeTableWrap } from './src/lib/rehype/index.mjs';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Site URL and base path live in apps/website/.env (PUBLIC_SITE_URL, PUBLIC_BASE_PATH).
const env = loadEnv('production', fileURLToPath(new URL('.', import.meta.url)), 'PUBLIC_');
const SITE = env.PUBLIC_SITE_URL;
const BASE = env.PUBLIC_BASE_PATH;

if (!SITE || !BASE) throw new Error('PUBLIC_SITE_URL and PUBLIC_BASE_PATH must be set in apps/website/.env');

// The site runs against the BUILT package (libs/easy-web-worker/dist), the same files npm publishes,
// so every example and snippet here is also a check of the published artifact.
const packageDist = here('../../libs/easy-web-worker/dist');

if (!existsSync(`${packageDist}/bundle.mjs`)) {
  throw new Error('libs/easy-web-worker/dist is missing. Run `yarn build easy-web-worker` first.');
}

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'always',
  // The bottom-of-page Astro toolbar is a dev-server-only overlay; turned off so it can never show up.
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    shikiConfig: { themes: shikiThemes, defaultColor: false, cssVariablePrefix: CSS_VARIABLE_PREFIX },
    // unified (not Astro 7's default Sätteri): the rehype plugins give MDX the reference document structure.
    processor: unified({ rehypePlugins: [rehypeSymptoms, rehypeCodeBlocks, rehypeTableWrap] }),
  },
  vite: {
    // worker files import the package, so they are emitted as ES modules
    worker: { format: 'es' },
    resolve: {
      // Subpath aliases precede the bare-name alias.
      alias: [
        { find: /^@snippets\/(.*)$/, replacement: `${here('./src/snippets')}/$1` },
        { find: /^@examples\/(.*)$/, replacement: `${here('./src/examples')}/$1` },
        { find: /^easy-web-worker\/(.*)$/, replacement: `${packageDist}/$1.mjs` },
        { find: /^easy-web-worker$/, replacement: `${packageDist}/bundle.mjs` },
      ],
    },
  },
});
