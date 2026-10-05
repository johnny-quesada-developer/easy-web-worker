#!/usr/bin/env node
/**
 * Generates the 1200x630 share thumbnails in public/og/ from page titles.
 *
 *   node scripts/make-og.mjs
 *
 * Titles and descriptions come from the docs/examples frontmatter, so a new page only needs to re-run this
 * script. The PNGs are committed: CI does not regenerate them, so the build never depends on installed fonts.
 * Rendered with sharp (SVG -> PNG) using the site palette on a white background.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'public/og');

const color = {
  bg: '#ffffff',
  text: '#1d2422',
  muted: '#626d66',
  primary: '#326c52',
  mint: '#edf4ee',
  sky: '#f0f2f8',
  yellow: '#faf5e9',
};
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word wrap using an average glyph width; good enough for short titles. */
function wrap(text, fontSize, maxWidth, maxLines) {
  const perLine = Math.floor(maxWidth / (fontSize * 0.54));
  const lines = [];
  let line = '';

  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > perLine) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:]*$/, '') + '…';
    return kept;
  }
  return lines;
}

function svg({ kicker, title, description }) {
  const titleLines = wrap(title, 68, 1040, 3);
  const descLines = wrap(description, 30, 1040, titleLines.length > 2 ? 1 : 2);
  const titleY = 284;
  const descY = titleY + (titleLines.length - 1) * 78 + 62;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${color.bg}"/>
  <rect x="0" y="574" width="400" height="56" fill="${color.mint}"/>
  <rect x="400" y="574" width="400" height="56" fill="${color.sky}"/>
  <rect x="800" y="574" width="400" height="56" fill="${color.yellow}"/>
  <g transform="translate(80 84)">
    <g transform="scale(2)" fill="none" stroke="${color.primary}" stroke-linecap="round">
      <path d="M5 6v20m22-20v20M5 10h8l6 12h8" stroke-width="2.3"/>
      <circle cx="5" cy="10" r="3.5" fill="#ffffff" stroke-width="2"/>
      <circle cx="27" cy="22" r="3.5" fill="#ffffff" stroke-width="2"/>
    </g>
  </g>
  <text x="164" y="128" font-family="${FONT}" font-size="34" font-weight="700" fill="${color.text}">easy-web-worker</text>
  <text x="80" y="206" font-family="${FONT}" font-size="26" font-weight="700" fill="${color.primary}" letter-spacing="1.5">${escape(kicker.toUpperCase())}</text>
  ${titleLines.map((line, i) => `<text x="80" y="${titleY + i * 78}" font-family="${FONT}" font-size="68" font-weight="700" fill="${color.text}">${escape(line)}</text>`).join('\n  ')}
  ${descLines.map((line, i) => `<text x="80" y="${descY + i * 40}" font-family="${FONT}" font-size="30" fill="${color.muted}">${escape(line)}</text>`).join('\n  ')}
</svg>`;
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const block = text.match(/^---\n([\s\S]*?)\n---/)[1];
  const get = (key) => block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim();

  return { title: get('title'), description: get('description'), section: get('section') };
}

const pages = [
  {
    file: 'home',
    kicker: 'Web Workers for JavaScript and TypeScript',
    title: 'Web Workers are powerful. Now they are also easy.',
    description: 'Typed methods instead of messages, cancelable promises, progress and worker pools.',
  },
  {
    file: 'docs',
    kicker: 'Documentation',
    title: 'easy-web-worker documentation',
    description: 'Guides and reference for typed workers, cancellation, progress, pools and runtime workers.',
  },
  {
    file: 'examples',
    kicker: 'Examples',
    title: 'Working examples with live demos',
    description: 'A responsive page, progress and cancellation, a worker pool and transferable buffers, running live.',
  },
  {
    file: 'about',
    kicker: 'About the author',
    title: 'Johnny Quesada',
    description: 'Senior product engineer. Case studies, engineering approach and open-source work.',
  },
];

for (const [dir, kind] of [
  ['docs', 'Documentation'],
  ['examples', 'Example'],
]) {
  const folder = path.join(root, 'src/content', dir);

  for (const name of fs.readdirSync(folder).filter((entry) => entry.endsWith('.mdx'))) {
    const { title, description, section } = frontmatter(path.join(folder, name));
    pages.push({ file: `${dir}/${name.replace(/\.mdx$/, '')}`, kicker: section ?? kind, title, description });
  }
}

fs.mkdirSync(path.join(out, 'docs'), { recursive: true });
fs.mkdirSync(path.join(out, 'examples'), { recursive: true });

for (const page of pages) {
  await sharp(Buffer.from(svg(page)))
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(out, `${page.file}.png`));
}

console.log(`[make-og] wrote ${pages.length} images to public/og`);
