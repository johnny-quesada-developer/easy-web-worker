import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const globalName = 'm$';

type WorkerTemplate = {
  /** Name of the generated module and of the function it exports */
  name: string;

  /** File bundled into the template */
  sourceFile: string;

  /** What the generated file contains, added to its header */
  description: string;

  /** Expression returned by the template, it receives the name that holds the exports of the source */
  result: (exports: string) => string;

  /** The template is evaluated inside the worker, so it must be a valid expression */
  isValid: (value: any, self: { onmessage: unknown }) => boolean;
};

/**
 * Code injected into the workers created from functions.
 * Each template is the minified bundle of a source file, generated so it never gets out of date.
 */
export const templates = {
  /** createEasyWebWorker(body): an instance of the static worker */
  worker: {
    name: 'getWorkerTemplate',
    sourceFile: path.join(root, 'src/StaticEasyWebWorker.ts'),
    description:
      'It contains the minified version of ./StaticEasyWebWorker.ts, used to create workers from functions.',
    result: (exports) => `new ${exports}.StaticEasyWebWorker()`,
    isValid: (instance, self) =>
      typeof instance?.onMessage === 'function' &&
      typeof instance?.close === 'function' &&
      typeof instance?.importScripts === 'function' &&
      typeof self.onmessage === 'function',
  },

  /** createWorker(builder): the function that builds the worker from the builder */
  defineWorker: {
    name: 'getDefineWorkerTemplate',
    sourceFile: path.join(root, 'src/buildWorker.ts'),
    description:
      'It contains the minified version of ./buildWorker.ts, used by createWorker to create workers from functions.',
    result: (exports) => `${exports}.buildWorker`,
    isValid: (buildWorker) => typeof buildWorker === 'function',
  },
} satisfies Record<string, WorkerTemplate>;

const getTemplateFile = ({ name }: WorkerTemplate) =>
  path.join(root, `src/${name}.ts`);

/**
 * Bundles the source of the template into a single JavaScript expression
 */
export const buildTemplate = async (template: WorkerTemplate): Promise<string> => {
  const { outputFiles } = await esbuild.build({
    entryPoints: [template.sourceFile],
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
  const expression = `(()=>{${bundle}return ${template.result(globalName)}})()`;

  const self = { onmessage: null };
  const value = new Function('self', `return ${expression}`)(self);

  if (!template.isValid(value, self)) {
    throw new Error(`The template ${template.name} is not valid.`);
  }

  return expression;
};

export const renderTemplateModule = (
  template: WorkerTemplate,
  expression: string
): string =>
  [
    '/**',
    ' * GENERATED FILE, do not edit it by hand.',
    ` * ${template.description}`,
    ' * To update it run `yarn build:template`, `yarn build` also does it.',
    ' */',
    `export const ${template.name} = () => {`,
    `  const template = ${JSON.stringify(expression)};`,
    '',
    '  return template;',
    '};',
    '',
    `export default ${template.name};`,
    '',
  ].join('\n');

/**
 * Returns the content each template file should have, and whether the current file matches it
 */
export const getTemplatesStatus = () =>
  Promise.all(
    Object.values(templates).map(async (template: WorkerTemplate) => {
      const file = getTemplateFile(template);
      const expected = renderTemplateModule(template, await buildTemplate(template));
      const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;

      return {
        name: template.name,
        file,
        expected,
        isUpToDate: current === expected,
      };
    })
  );
