import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');

export const sourceFile = path.join(root, 'src/StaticEasyWebWorker.ts');
export const templateFile = path.join(root, 'src/getWorkerTemplate.ts');

const globalName = 'm$';

/**
 * Bundles StaticEasyWebWorker into a single JavaScript expression that returns a new instance of it.
 * That expression is what createBlobWorker injects into the workers created from functions.
 */
export const buildWorkerTemplate = async (): Promise<string> => {
  const { outputFiles } = await esbuild.build({
    entryPoints: [sourceFile],
    bundle: true,
    write: false,
    format: 'iife',
    globalName,
    platform: 'neutral',
    target: ['es2017'],
    minify: true,
    legalComments: 'none',
    logLevel: 'silent',
  });

  const bundle = outputFiles[0].text.trim().replace(/;*$/, ';');
  const template = `(()=>{${bundle}return new ${globalName}.StaticEasyWebWorker()})()`;

  assertTemplate(template);

  return template;
};

/**
 * The template is evaluated inside the worker, so it must be a valid expression that creates the worker instance
 */
const assertTemplate = (template: string) => {
  const self = { onmessage: null };
  const instance = new Function('self', `return ${template}`)(self);

  const isValid =
    typeof instance?.onMessage === 'function' &&
    typeof instance?.close === 'function' &&
    typeof instance?.importScripts === 'function' &&
    typeof self.onmessage === 'function';

  if (!isValid) {
    throw new Error('The worker template does not create a valid worker instance.');
  }
};

export const renderTemplateModule = (template: string): string =>
  [
    '/**',
    ' * GENERATED FILE, do not edit it by hand.',
    ' * It contains the minified version of ./StaticEasyWebWorker.ts, used to create workers from functions.',
    ' * To update it run `yarn build:template`, `yarn build` also does it.',
    ' */',
    'export const getWorkerTemplate = () => {',
    `  const template = ${JSON.stringify(template)};`,
    '',
    '  return template;',
    '};',
    '',
    'export default getWorkerTemplate;',
    '',
  ].join('\n');

/**
 * Returns the content the template file should have, and whether the current file matches it
 */
export const getTemplateModuleStatus = async () => {
  const expected = renderTemplateModule(await buildWorkerTemplate());

  const current = fs.existsSync(templateFile)
    ? fs.readFileSync(templateFile, 'utf8')
    : null;

  return { expected, isUpToDate: current === expected };
};
