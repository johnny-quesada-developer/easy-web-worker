import type {
  EasyWebWorkerBody,
  IWorkerConfig,
  WorkerMethods,
  WorkerDefinition,
  WorkerProxy,
} from './types';

import { EasyWebWorker } from './EasyWebWorker';
import { workerInstance$ } from './unwrap';

/**
 * Creates a worker in the main thread, each method of the worker is a function that returns a CancelablePromise.
 * To reach the rest of the worker api (cancelAll, reboot, dispose, ...) use unwrap(worker).
 *
 * @example
 * import type { MyWorker } from './myWorker';
 *
 * const worker = createWorker<MyWorker>(new URL('./myWorker', import.meta.url));
 *
 * await worker.double(21);
 * await unwrap(worker).dispose();
 */
export const createWorker = <
  TWorker extends WorkerDefinition<any> | WorkerMethods = WorkerMethods,
  TPrimitiveParameters extends any[] = unknown[]
>(
  source:
    | EasyWebWorkerBody<any, any>
    | EasyWebWorkerBody<any, any>[]
    | string
    | URL
    | Worker
    | Worker[],
  config: Partial<IWorkerConfig<TPrimitiveParameters>> = {}
): WorkerProxy<TWorker> => {
  const worker = new EasyWebWorker<unknown, unknown, TPrimitiveParameters>(
    source,
    config
  );

  const methods = new Map<string, Function>();

  return new Proxy({} as WorkerProxy<TWorker>, {
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
