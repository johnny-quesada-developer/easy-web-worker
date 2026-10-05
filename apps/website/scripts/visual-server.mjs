#!/usr/bin/env node
/**
 * Foreground static server for the visual regression suite (playwright.config.ts). `astro preview`
 * detaches into a background daemon, which Playwright's webServer cannot manage.
 *
 *   node scripts/visual-server.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const base = '/easy-web-worker/';
const port = Number(process.argv[2] ?? process.env.VISUAL_PORT ?? 4330);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

const send = (response, status, file) => {
  response.writeHead(status, {
    'content-type': types[path.extname(file)] ?? 'application/octet-stream',
    'content-length': statSync(file).size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
};

const notFound = (response) => {
  const page = path.join(root, '404.html');

  if (existsSync(page)) return send(response, 404, page);

  response.writeHead(404, { 'content-type': 'text/plain' });
  response.end('Not found');
};

const server = createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  if (!url.pathname.startsWith(base)) {
    response.writeHead(302, { location: base });
    return response.end();
  }

  const relative = decodeURIComponent(url.pathname.slice(base.length));
  const target = path.join(root, relative);

  if (!target.startsWith(root)) return notFound(response);

  if (path.extname(relative)) {
    return existsSync(target) ? send(response, 200, target) : notFound(response);
  }

  if (relative !== '' && !relative.endsWith('/')) {
    response.writeHead(301, { location: `${url.pathname}/${url.search}` });
    return response.end();
  }

  const page = path.join(target, 'index.html');

  return existsSync(page) ? send(response, 200, page) : notFound(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving dist/ at http://127.0.0.1:${port}${base}`);
});
