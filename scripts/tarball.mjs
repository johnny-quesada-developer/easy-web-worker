#!/usr/bin/env node
/**
 * Build every publishable library and produce an `npm pack` tarball for each, so you can inspect
 * exactly what would be published before deploying.
 *
 * Usage:
 *   yarn tarball            # all publishable libs
 *   yarn tarball easy-web-worker  # a single lib
 *
 * For each lib it:
 *   1. builds the lib (so libs/<lib>/dist is publish-ready, via the lib's own build script)
 *   2. runs `npm pack` inside libs/<lib>/dist, writing the .tgz into <root>/artifacts/
 *   3. prints the tarball name, size, file count, and the full file list
 *
 * The tarball is the EXACT set of files npm would upload, so this is the reliable pre-publish
 * inspection step. Publishable libs are those whose package.json is not `private`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');
const libsDir = path.join(workspaceRoot, 'libs');
const artifactsDir = path.join(workspaceRoot, 'artifacts');

/** Publishable libs: have a package.json and are not private. */
function discoverPublishableLibs() {
  if (!fs.existsSync(libsDir)) return [];
  return fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => {
      const pkgPath = path.join(libsDir, name, 'package.json');
      if (!fs.existsSync(pkgPath)) return false;
      try {
        return !JSON.parse(fs.readFileSync(pkgPath, 'utf8')).private;
      } catch {
        return false;
      }
    })
    .sort();
}

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const all = discoverPublishableLibs();
const libs = requested.length ? requested.filter((l) => all.includes(l)) : all;

if (!libs.length) {
  console.error(`[tarball] no matching publishable libs. Available: ${all.join(', ') || '(none)'}`);
  process.exit(1);
}

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  return res.status ?? 1;
}

function runCapture(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: process.env });
  return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

fs.mkdirSync(artifactsDir, { recursive: true });

const results = [];

for (const lib of libs) {
  const libDir = path.join(libsDir, lib);
  const distDir = path.join(libDir, 'dist');

  console.log(`\n=== ${lib}: build ===`);
  const buildStatus = run('node', [path.join(__dirname, 'run.mjs'), 'build', lib], workspaceRoot);
  if (buildStatus !== 0) {
    results.push({ lib, ok: false, note: 'build failed' });
    continue;
  }

  if (!fs.existsSync(path.join(distDir, 'package.json'))) {
    results.push({ lib, ok: false, note: 'dist/package.json missing after build' });
    continue;
  }

  console.log(`=== ${lib}: npm pack (from dist) ===`);
  // `npm pack --json --pack-destination <artifacts>` packs and reports the exact contents.
  const packed = runCapture(
    'npm',
    ['pack', '--json', `--pack-destination=${artifactsDir}`],
    distDir,
  );

  if (packed.status !== 0) {
    console.error(packed.stderr);
    results.push({ lib, ok: false, note: 'npm pack failed' });
    continue;
  }

  let info;
  try {
    info = JSON.parse(packed.stdout)[0];
  } catch {
    results.push({ lib, ok: false, note: 'could not parse npm pack output' });
    continue;
  }

  results.push({
    lib,
    ok: true,
    name: info.filename,
    npmName: `${info.name}@${info.version}`,
    files: info.entryCount ?? (info.files ? info.files.length : undefined),
    unpackedSize: info.unpackedSize,
    fileList: (info.files ?? []).map((f) => f.path),
  });
}

// --- report ---
console.log('\n\n================ tarball report ================\n');
for (const r of results) {
  if (!r.ok) {
    console.log(`✗ ${r.lib}: ${r.note}`);
    continue;
  }
  const kb = (n) => (typeof n === 'number' ? `${(n / 1024).toFixed(1)} KB` : '?');
  console.log(`✓ ${r.npmName}`);
  console.log(`    tarball: artifacts/${r.name}`);
  console.log(`    files:   ${r.files}   unpacked: ${kb(r.unpackedSize)}`);
  for (const f of r.fileList) console.log(`      - ${f}`);
  console.log('');
}

const failed = results.filter((r) => !r.ok);
console.log(`Tarballs written to: artifacts/`);
console.log(failed.length ? `\n${failed.length} lib(s) failed.` : `\nAll ${results.length} lib(s) packed.`);
process.exit(failed.length ? 1 : 0);
