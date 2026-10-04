#!/usr/bin/env node
/**
 * Monorepo task dispatcher.
 *
 * Translates a single package.json script into a target-aware Nx invocation so that every
 * script has the shape `yarn <task> [project] [extra nx/executor flags...]`.
 *
 *   yarn test easy-web-worker   -> nx run easy-web-worker:test
 *   yarn build easy-web-worker  -> nx run easy-web-worker:build
 *
 * When no project is given, the task runs across every project that defines it:
 *
 *   yarn test                   -> nx run-many -t test
 *
 * The task name is passed as the first arg by the root package.json wrapper
 * (`node scripts/run.mjs <task>`). Everything the user typed after `yarn <task>` arrives in
 * argv after that: the first non-flag token that matches a known project is treated as the
 * project, the rest are forwarded to Nx untouched.
 *
 * Known projects are discovered from the `libs/*` workspaces so new libs work without touching
 * this file.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..');
const projectDirs = [path.join(workspaceRoot, 'libs'), path.join(workspaceRoot, 'apps')];

/** Read the Nx project name for every project under libs/* and apps/*. */
function discoverProjects() {
  const projects = new Set();
  for (const dir of projectDirs) {
    if (!fs.existsSync(dir)) continue;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const projectJson = path.join(dir, entry.name, 'project.json');
      let name = entry.name;
      if (fs.existsSync(projectJson)) {
        try {
          name = JSON.parse(fs.readFileSync(projectJson, 'utf8')).name ?? name;
        } catch {
          // fall through to the folder name
        }
      }
      projects.add(name);
    }
  }
  return projects;
}

const [task, ...rest] = process.argv.slice(2);

if (!task) {
  console.error('[run] missing task name. Usage: node scripts/run.mjs <task> [project] [...flags]');
  process.exit(1);
}

const projects = discoverProjects();

let project;
const passthrough = [];
for (const arg of rest) {
  if (!project && !arg.startsWith('-') && projects.has(arg)) {
    project = arg;
    continue;
  }
  passthrough.push(arg);
}

// Nx hides the output of successful tasks by default, which would hide the test summary.
if (!passthrough.some((arg) => arg.startsWith('--output-style') || arg.startsWith('--outputStyle'))) {
  passthrough.push('--output-style=stream-without-prefixes');
}

const nxArgs = project
  ? ['nx', 'run', `${project}:${task}`, ...passthrough]
  : ['nx', 'run-many', '-t', task, ...passthrough];

const result = spawnSync('yarn', nxArgs, {
  cwd: workspaceRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(`[run] failed to start nx: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
