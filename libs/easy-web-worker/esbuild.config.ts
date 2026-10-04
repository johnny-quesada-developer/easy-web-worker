/**
 * Emit ESM (.mjs), CommonJS (.cjs) and legacy .js entries into ./dist.
 * Keep dependencies and sibling modules external to preserve shared instances.
 */
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const entryPoints: Record<string, string> = {
  bundle: 'src/index.ts',
  createBlobWorker: 'src/createBlobWorker.ts',
  createEasyWebWorker: 'src/createEasyWebWorker.ts',
  createStaticEasyWebWorker: 'src/createStaticEasyWebWorker.ts',
  EasyWebWorker: 'src/EasyWebWorker.ts',
  EasyWebWorkerMessage: 'src/EasyWebWorkerMessage.ts',
  getWorkerTemplate: 'src/getWorkerTemplate.ts',
  StaticEasyWebWorker: 'src/StaticEasyWebWorker.ts',
  types: 'src/types.ts',
  uniqueId: 'src/uniqueId.ts',
};

// Resolve runtime dependencies from the consumer's installation.
const bareExternals = ['easy-cancelable-promise', 'easy-cancelable-promise/*'];

const outdir = path.resolve(__dirname, 'dist');

/** Keep sibling imports external and match their extension to the output format. */
const relativeSiblingExternal = (extension: string): esbuild.Plugin => ({
  name: 'relative-sibling-external',
  setup(build) {
    build.onResolve({ filter: /^\.\// }, (args) => {
      // Never externalize the entry points themselves.
      if (args.kind === 'entry-point') return null;

      const withoutExt = args.path.replace(/\.(ts|js|mjs|cjs)$/, '');
      return {
        path: `${withoutExt}${extension}`,
        external: true,
      };
    });
  },
});

const shared: esbuild.BuildOptions = {
  entryPoints,
  outdir,
  bundle: true,
  platform: 'neutral',
  target: ['es2017'],
  // No sourcemaps in the published output: they would reference ../src which is not shipped.
  sourcemap: false,
  logLevel: 'info',
  minify: true,
  external: bareExternals,
};

async function build(): Promise<void> {
  await esbuild.build({
    ...shared,
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    plugins: [relativeSiblingExternal('.mjs')],
  });

  // platform node makes esbuild annotate the CJS named exports, so Node ESM can import them by name
  await esbuild.build({
    ...shared,
    platform: 'node',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    plugins: [relativeSiblingExternal('.cjs')],
  });

  // Preserve legacy deep imports ending in .js.
  await esbuild.build({
    ...shared,
    platform: 'node',
    format: 'cjs',
    outExtension: { '.js': '.js' },
    plugins: [relativeSiblingExternal('.js')],
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
