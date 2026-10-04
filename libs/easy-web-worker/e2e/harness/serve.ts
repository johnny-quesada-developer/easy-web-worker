/**
 * Bundles the e2e harness and serves it, so the specs can run real workers in a real browser.
 * EASY_WEB_WORKER_TEST_TARGET picks what `easy-web-worker` resolves to:
 *   - src  (default): the TypeScript source
 *   - dist: the built, publishable package in ./dist (run `yarn build` first)
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const harness = __dirname;
const root = path.resolve(harness, '../..');
const outdir = path.resolve(harness, '../.harness');

const target = process.env.EASY_WEB_WORKER_TEST_TARGET === 'dist' ? 'dist' : 'src';
const port = Number(process.env.EASY_WEB_WORKER_E2E_PORT ?? 4319);

const resolveSubject = (name: string) =>
  target === 'dist' ? path.join(root, `dist/${name}.mjs`) : path.join(root, `src/${name}.ts`);

const subject = target === 'dist' ? resolveSubject('bundle') : resolveSubject('index');

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

async function build(): Promise<void> {
  if (!fs.existsSync(subject)) {
    throw new Error(`${subject} does not exist. Run \`yarn build\` first.`);
  }

  fs.rmSync(outdir, { recursive: true, force: true });

  await esbuild.build({
    entryPoints: {
      main: path.join(harness, 'main.ts'),
      'static.worker': path.join(harness, 'static.worker.ts'),
      'define.worker': path.join(harness, 'define.worker.ts'),
    },
    outdir,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    alias: {
      'easy-web-worker': subject,
      'easy-web-worker/defineWorker': resolveSubject('defineWorker'),
    },
    logLevel: 'warning',
  });
}

function resolveFile(urlPath: string): string | null {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');

  // bundles first, then the static files of the harness
  for (const base of [outdir, harness]) {
    const file = path.resolve(base, relative);
    const isInsideBase = file.startsWith(base + path.sep);

    if (isInsideBase && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }

  return null;
}

build()
  .then(() => {
    http
      .createServer((request, response) => {
        const { pathname } = new URL(request.url ?? '/', `http://${request.headers.host}`);
        const file = resolveFile(pathname);

        if (!file) {
          response.writeHead(404).end('not found');
          return;
        }

        response.writeHead(200, {
          'content-type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
          'cache-control': 'no-store',
        });

        fs.createReadStream(file).pipe(response);
      })
      .listen(port, '127.0.0.1', () => {
        console.log(`[e2e] serving easy-web-worker (${target}) on http://127.0.0.1:${port}`);
      });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
