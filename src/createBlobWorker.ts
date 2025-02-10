import { getWorkerTemplate } from './getWorkerTemplate';
import { EasyWebWorkerBody } from './types';

const getImportScriptsTemplate = (scripts: string[] = []) => {
  if (!scripts.length) return '';

  return `self.importScripts(["${scripts.join('","')}"]);`;
};

export const createBlobWorker = <
  IPayload = null,
  IResult = void,
  TPrimitiveParameters extends any[] = unknown[]
>(
  source:
    | EasyWebWorkerBody<IPayload, IResult>
    | EasyWebWorkerBody<IPayload, IResult>[],
  imports: string[] = [],
  {
    primitiveParameters = [] as TPrimitiveParameters,
  }: {
    primitiveParameters?: TPrimitiveParameters;
  } = {}
) => {
  const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
    Array.isArray(source) ? source : [source];

  const worker_content = `${getImportScriptsTemplate(
    imports
  )}self.primitiveParameters=JSON.parse(\`${JSON.stringify(
    primitiveParameters ?? []
  )}\`);let ew$=${getWorkerTemplate()};let cn$=self;${contentCollection
    .map((content) => {
      return `\n(${content?.toString().trim()})(ew$,cn$);`;
    })
    .join('')}`;

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob([worker_content], { type: 'application/javascript' })
  );
};
