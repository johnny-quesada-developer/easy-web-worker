import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));

export interface Route {
  /** Stable screenshot file name, for example `docs-getting-started`. */
  name: string;
  /** Path relative to the preview server base URL, for example `docs/getting-started/`. */
  path: string;
}

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);

    if (entry.isDirectory()) return htmlFiles(full);

    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

/** Every page the site builds, read from `dist/`. `404.html` is reached through an unknown path. */
export function routes(): Route[] {
  if (!existsSync(dist)) {
    throw new Error('apps/website/dist is missing. Run `yarn build` before the visual tests.');
  }

  const pages = htmlFiles(dist)
    .map((file) => relative(dist, file))
    .filter((file) => file !== '404.html')
    .map((file) => file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '/'));

  return pages
    .map((path) => ({ path, name: path === '' ? 'home' : path.replace(/\/$/, '').replace(/\//g, '-') }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
