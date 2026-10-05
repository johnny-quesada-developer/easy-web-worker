import type {
  IWorkerConfig,
  MergeWorkerMethods,
  WorkerBuilder,
  WorkerMethods,
  WorkerDefinition,
  WorkerProxy,
} from './types';

import { EasyWebWorker } from './EasyWebWorker';
import { getImportScriptsTemplate } from './createBlobWorker';
import { getDefineWorkerTemplate } from './getDefineWorkerTemplate';
import { workerInstance$ } from './unwrap';

type WorkerFile = string | URL | Worker | Worker[];

/**
 * Creates the file of a worker from functions: the worker builder is injected and executed with them.
 * Every function receives the same helpers and the same scope, the methods they return are merged, the last one wins.
 */
const createWorkerUrl = (
  builders: readonly Function[],
  { scripts, primitiveParameters }: Partial<IWorkerConfig<any[]>>
): string => {
  const content = `${getImportScriptsTemplate(
    scripts ?? []
  )}self.primitiveParameters=JSON.parse(\`${JSON.stringify(
    primitiveParameters ?? []
  )}\`);let dw$=${getDefineWorkerTemplate()};\ndw$((hp$,cn$)=>Object.assign({},...[${builders
    .map((builder) => `\n(${builder.toString().trim()})`)
    .join(',')}\n].map((bd$)=>bd$(hp$,cn$))));`;

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob([content], { type: 'application/javascript' })
  );
};

const getWorkerSource = (
  source: WorkerFile | Function | readonly Function[],
  config: Partial<IWorkerConfig<any[]>>
): WorkerFile => {
  if (typeof source === 'function') return createWorkerUrl([source], config);

  if (Array.isArray(source) && typeof source[0] === 'function') {
    return createWorkerUrl(source as unknown as readonly Function[], config);
  }

  return source as WorkerFile;
};

type CreateWorker = {
  /**
   * Creates a worker from a function, with no worker file.
   * The function returns the methods of the worker, same as the builder of defineWorker, and their types are inferred.
   *
   * The function becomes the source of a real worker, so it can not use variables from outside of it.
   * The message api is still available inside of it through easyWorker: ({ onMessage, easyWorker }, context) => { ... }
   *
   * @example
   * const math = createWorker(({ onMessage }) => ({
   *   double: (value: number) => value * 2,
   * }));
   *
   * await math.double(21);
   */
  <
    TMethods extends WorkerMethods,
    TPrimitiveParameters extends any[] = unknown[]
  >(
    builder: WorkerBuilder<TMethods, TPrimitiveParameters>,
    config?: Partial<IWorkerConfig<TPrimitiveParameters>>
  ): WorkerProxy<TMethods>;

  /**
   * Creates a worker from several functions, with no worker file.
   * They share the scope of the worker and the methods they return are merged, if a method is repeated the last one wins.
   *
   * @example
   * const worker = createWorker([
   *   () => ({ double: (value: number) => value * 2 }),
   *   () => ({ triple: (value: number) => value * 3 }),
   * ]);
   *
   * await worker.double(21);
   * await worker.triple(21);
   */
  <
    TBuilders extends WorkerBuilder<WorkerMethods | void, TPrimitiveParameters>[],
    TPrimitiveParameters extends any[] = unknown[]
  >(
    builders: readonly [...TBuilders],
    config?: Partial<IWorkerConfig<TPrimitiveParameters>>
  ): WorkerProxy<MergeWorkerMethods<TBuilders>>;

  /**
   * Creates a worker from a worker file, each method of the worker is a function that returns a CancelablePromise.
   * To reach the rest of the worker api (cancelAll, reboot, dispose, ...) use unwrap(worker).
   *
   * The methods can also be described with the generic, for a worker file that is not created with defineWorker
   * or for a function that registers its methods with the message api of easyWorker.
   *
   * @example
   * import type { MyWorker } from './myWorker';
   *
   * const worker = createWorker<MyWorker>(new URL('./myWorker', import.meta.url));
   *
   * await worker.double(21);
   * await unwrap(worker).dispose();
   */
  <
    TWorker extends WorkerDefinition<any> | WorkerMethods = WorkerMethods,
    TPrimitiveParameters extends any[] = unknown[]
  >(
    source:
      | WorkerFile
      | WorkerBuilder<any, TPrimitiveParameters>
      | readonly WorkerBuilder<any, TPrimitiveParameters>[],
    config?: Partial<IWorkerConfig<TPrimitiveParameters>>
  ): WorkerProxy<TWorker>;
};

export const createWorker: CreateWorker = (
  source: WorkerFile | Function | readonly Function[],
  config: Partial<IWorkerConfig<any[]>> = {}
) => {
  const worker = new EasyWebWorker<unknown, unknown, any[]>(
    getWorkerSource(source, config ?? {}),
    config
  );

  const methods = new Map<string, Function>();

  return new Proxy({} as WorkerProxy<WorkerMethods>, {
    get: (_, property) => {
      if (property === workerInstance$) return worker;

      // then: the worker is not a promise, awaiting it should not send a message
      if (typeof property !== 'string' || property === 'then') return undefined;

      if (!methods.has(property)) {
        methods.set(property, (payload?: unknown, transfer?: Transferable[]) =>
          worker.sendToMethod(property, payload, transfer)
        );
      }

      return methods.get(property);
    },

    has: (_, property) =>
      property === workerInstance$ ||
      (typeof property === 'string' && property !== 'then'),

    // the methods are defined by the worker
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
};

export { unwrap } from './unwrap';
export type * from './types';

export default createWorker;
