import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

rmSync('public/pagefind', { recursive: true, force: true });

const site = mkdtempSync(join(tmpdir(), 'eww-search-'));

const run = (args) => {
  const { status } = spawnSync('npx', args, { stdio: 'inherit' });
  if (status !== 0) {
    rmSync(site, { recursive: true, force: true });
    process.exit(status ?? 1);
  }
};

run(['astro', 'build', '--outDir', site]);
run(['pagefind', '--site', site, '--output-path', 'public/pagefind']);
rmSync(site, { recursive: true, force: true });
