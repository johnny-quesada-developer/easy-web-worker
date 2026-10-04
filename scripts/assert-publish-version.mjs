#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const semver = createRequire(import.meta.url)('semver');

export function assertVersionMatchesTag(packageDir, tag) {
  const distManifest = path.join(packageDir, 'dist', 'package.json');
  const manifest = fs.existsSync(distManifest) ? distManifest : path.join(packageDir, 'package.json');
  const { name, version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const prerelease = semver.prerelease(version);

  if (tag === 'beta' && prerelease?.[0] !== 'beta') {
    throw new Error(`${name}@${version} cannot go to the "beta" tag: the version must look like x.y.z-beta.N`);
  }
  if (tag === 'latest' && prerelease) {
    throw new Error(`${name}@${version} cannot go to the "latest" tag: it is a prerelease`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    assertVersionMatchesTag(process.cwd(), process.argv[2]);
  } catch (error) {
    console.error(`[publish] ${error.message}`);
    process.exit(1);
  }
}
