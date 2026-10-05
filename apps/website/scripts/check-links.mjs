#!/usr/bin/env node
/**
 * Static link check for the built site (dist/). No browser.
 *
 * For every internal reference in every HTML file (a[href], img/video/source/script[src], link[href],
 * video[poster], meta og:image and canonical) verifies that the target file exists under dist/ and, for
 * #fragments, that the id exists in the target page. External http(s) links are not fetched.
 *
 *   node scripts/check-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');

const env = Object.fromEntries(
  fs
    .readFileSync(path.resolve(here, '../.env'), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/=(.*)/s).slice(0, 2)),
);
const base = env.PUBLIC_BASE_PATH.replace(/\/+$/, '');
const origin = env.PUBLIC_SITE_URL;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
const idsCache = new Map();

function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  }
  return idsCache.get(file);
}

function resolveTarget(pathname) {
  const relative = pathname.slice(base.length).replace(/^\/+/, '');
  const candidates = [path.join(dist, relative), path.join(dist, relative, 'index.html')];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

const problems = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const pageUrl = `${origin}${base}/${path.relative(dist, file).replace(/index\.html$/, '')}`;
  const refs = [
    ...html.matchAll(/<(?:a|link|img|source|script|video)\b[^>]*?\s(?:href|src|poster)="([^"]+)"/g),
    ...html.matchAll(/<meta\s+(?:property="og:image"|name="twitter:image")\s+content="([^"]+)"/g),
    ...html.matchAll(/<link rel="canonical" href="([^"]+)"/g),
  ].map((match) => match[1]);

  for (const raw of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) continue;

    let url;
    try {
      url = new URL(raw.replaceAll('&amp;', '&'), pageUrl);
    } catch {
      problems.push(`${path.relative(dist, file)}: unparsable "${raw}"`);
      continue;
    }

    // external links are not fetched
    if (url.origin !== origin) continue;

    checked += 1;

    if (!url.pathname.startsWith(`${base}/`) && url.pathname !== base) {
      // an absolute link to another project on the same github.io host is external, not a mistake
      if (/^https?:/.test(raw)) {
        checked -= 1;
        continue;
      }

      problems.push(`${path.relative(dist, file)}: "${raw}" is outside the base path ${base}`);
      continue;
    }

    const target = resolveTarget(url.pathname);
    if (!target) {
      problems.push(`${path.relative(dist, file)}: "${raw}" -> no such file`);
      continue;
    }

    if (
      url.hash.length > 1 &&
      target.endsWith('.html') &&
      !idsOf(target).has(decodeURIComponent(url.hash.slice(1)))
    ) {
      problems.push(
        `${path.relative(dist, file)}: "${raw}" -> missing anchor in ${path.relative(dist, target)}`,
      );
    }
  }
}

console.log(`[check-links] ${htmlFiles.length} pages, ${checked} internal references checked`);

if (problems.length) {
  console.error(`[check-links] ${problems.length} problem(s):\n  ${[...new Set(problems)].join('\n  ')}`);
  process.exit(1);
}
