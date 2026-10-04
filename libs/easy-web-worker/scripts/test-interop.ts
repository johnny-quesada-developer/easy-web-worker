/**
 * Packaging interop regression test.
 *
 * Packs the real publishable artifact (from ./dist), installs it into a throwaway project
 * exactly like a consumer would (which transitively pulls easy-cancelable-promise), and then
 * imports the root entry and a subpath under:
 *   - esbuild (via tsx)
 *   - Node native ESM
 *   - Node CJS require
 *   - a browser bundle (esbuild --platform=browser), the only path that reads the .mjs files
 *
 * Node resolves the `node` export condition, which points at the CJS build: the dependency
 * easy-cancelable-promise ships UMD only, so its named exports are not importable from Node ESM.
 * That is also why a default import of a subpath is only asserted for CJS and the browser bundle.
 *
 * It fails (non-zero exit) if an export is missing or not callable.
 *
 * Run with: tsx scripts/test-interop.ts   (assumes `dist/` was already built)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');
const workspaceRoot = path.resolve(root, '../..');

function fail(msg: string): never {
  console.error(`\n[interop] FAIL: ${msg}`);
  process.exit(1);
}

function resolveBin(name: string): string {
  const candidates = [
    path.resolve(root, 'node_modules/.bin', name),
    path.resolve(workspaceRoot, 'node_modules/.bin', name),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) fail(`could not find the \`${name}\` binary in ${candidates.join(' or ')}.`);
  return found;
}

const tsxBin = resolveBin('tsx');
const esbuildBin = resolveBin('esbuild');

function run(cmd: string, args: string[], cwd: string): string {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
    fail(`\`${cmd} ${args.join(' ')}\` failed:\n${stdout}${stderr}`);
  }
}

if (!fs.existsSync(path.join(dist, 'bundle.mjs'))) {
  fail('dist/ is not built. Run `yarn build` first.');
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'easy-web-worker-interop-'));

try {
  // 1) Pack the real publishable tarball from dist.
  const tarballName = run('npm', ['pack', '--silent'], dist).trim().split('\n').pop()!.trim();
  const tarballPath = path.join(dist, tarballName);

  // 2) Install it into a throwaway consumer project.
  fs.writeFileSync(
    path.join(work, 'package.json'),
    JSON.stringify({ name: 'interop-scratch', private: true, version: '1.0.0' }, null, 2)
  );
  run('npm', ['install', tarballPath, '--no-audit', '--no-fund'], work);
  fs.rmSync(tarballPath, { force: true });

  const namedExports = ['EasyWebWorker', 'StaticEasyWebWorker', 'createEasyWebWorker', 'createStaticEasyWebWorker'];

  // 3) ESM probes: root entry + a subpath.
  const esmProbeLines = (withDefaultImport: boolean) => [
    "import * as root from 'easy-web-worker';",
    "import { EasyWebWorker } from 'easy-web-worker';",
    "import { uniqueId } from 'easy-web-worker/uniqueId';",
    withDefaultImport ? "import defaultUniqueId from 'easy-web-worker/uniqueId';" : 'const defaultUniqueId = uniqueId;',
    `for (const name of ${JSON.stringify(namedExports)}) {`,
    "  if (typeof root[name] !== 'function') { console.error('root export not callable: ' + name); process.exit(3); }",
    '}',
    "if (typeof EasyWebWorker !== 'function') { console.error('named EasyWebWorker not callable'); process.exit(4); }",
    "if (typeof defaultUniqueId !== 'function') { console.error('default not callable: ' + typeof defaultUniqueId); process.exit(5); }",
    "if (typeof uniqueId('a') !== 'string') { console.error('call did not return a string'); process.exit(6); }",
    "console.log('ok:' + JSON.stringify(Object.keys(root).sort()));",
  ];
  const esmProbe = esmProbeLines(false).join('\n');

  const tsxProbeFile = path.join(work, 'probe.mts');
  fs.writeFileSync(tsxProbeFile, esmProbe);
  const tsxOut = run(tsxBin, [tsxProbeFile], work).trim();
  if (!tsxOut.includes('ok:')) fail(`tsx probe unexpected output: ${tsxOut}`);
  console.log(`[interop] tsx (esbuild): ${tsxOut}`);

  const mjsFile = path.join(work, 'probe.mjs');
  fs.writeFileSync(mjsFile, esmProbe);
  const nodeEsm = run('node', [mjsFile], work).trim();
  if (!nodeEsm.includes('ok:')) fail(`node ESM probe unexpected output: ${nodeEsm}`);
  console.log(`[interop] node ESM:      ${nodeEsm}`);

  // 3c) Browser bundle: resolves the `import` condition, so it is built from the .mjs files.
  const browserEntry = path.join(work, 'browser-entry.mjs');
  const browserBundle = path.join(work, 'browser-bundle.mjs');
  fs.writeFileSync(browserEntry, esmProbeLines(true).join('\n'));
  run(
    esbuildBin,
    [browserEntry, '--bundle', '--platform=browser', '--format=esm', '--metafile=meta.json', `--outfile=${browserBundle}`],
    work
  );
  const bundledInputs = Object.keys(
    (JSON.parse(fs.readFileSync(path.join(work, 'meta.json'), 'utf8')) as { inputs: Record<string, unknown> }).inputs
  );
  if (!bundledInputs.some((input) => input.endsWith('easy-web-worker/bundle.mjs'))) {
    fail(`browser bundle did not use the ESM build: ${bundledInputs.join(', ')}`);
  }
  const browserOut = run('node', [browserBundle], work).trim();
  if (!browserOut.includes('ok:')) fail(`browser bundle probe unexpected output: ${browserOut}`);
  console.log(`[interop] browser bundle: ${browserOut}`);

  // 4) CJS probe.
  const cjsProbe = [
    "const root = require('easy-web-worker');",
    "const u = require('easy-web-worker/uniqueId');",
    `for (const name of ${JSON.stringify(namedExports)}) {`,
    "  if (typeof root[name] !== 'function') { console.error('cjs root export not callable: ' + name); process.exit(7); }",
    '}',
    "if (typeof u.default !== 'function') { console.error('cjs default not callable'); process.exit(8); }",
    "if (typeof u.uniqueId !== 'function') { console.error('cjs uniqueId not callable'); process.exit(9); }",
    "if (u.__esModule !== true) { console.error('cjs missing __esModule'); process.exit(10); }",
    "if (typeof u.default('a') !== 'string') { console.error('cjs call failed'); process.exit(11); }",
    "console.log('ok:' + JSON.stringify(Object.keys(root).sort()));",
  ].join('\n');
  const cjsFile = path.join(work, 'probe.cjs');
  fs.writeFileSync(cjsFile, cjsProbe);
  const cjsOut = run('node', [cjsFile], work).trim();
  if (!cjsOut.includes('ok:')) fail(`node CJS probe unexpected output: ${cjsOut}`);
  console.log(`[interop] node CJS:      ${cjsOut}`);

  console.log(
    '\n[interop] PASS: root entry and subpath are callable under tsx (esbuild), Node ESM, Node CJS and a browser bundle.'
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
