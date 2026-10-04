import type {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
  WorkerDeferredHandler,
  WorkerDefinition,
  WorkerHelpers,
  WorkerMethodHandler,
  WorkerMethodMessage,
  WorkerMethods,
  WorkerOnMessage,
} from './types';

import { StaticEasyWebWorker } from './StaticEasyWebWorker';
import { workerInstance$ } from './unwrap';

const onMessage = ((handler?: WorkerMethodHandler<unknown, unknown>) => {
  // onMessage((payload, message) => result), the wrapper only exists to infer the types
  if (handler) return handler;

  // onMessage<TPayload, TResult>().handle((message) => { ... })
  return {
    handle: (
      callback: WorkerDeferredHandler<unknown, unknown>['handle']
    ): WorkerDeferredHandler<unknown, unknown> => ({ handle: callback }),
  };
}) as WorkerOnMessage;

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown>)?.then === 'function';

/**
 * Executes a method and completes the message with its outcome.
 * If the method already completed the message by itself (resolve with transferable objects, cancel, ...) nothing else is sent.
 */
const executeMethod = (
  handler: WorkerMethodHandler<unknown, unknown>,
  message: IEasyWebWorkerMessage<unknown, unknown>,
  event: MessageEvent<IMessageData<unknown>>
) => {
  const resolve = (result: unknown) => {
    if (message.isPending()) message.resolve(result);
  };

  const reject = (reason: unknown) => {
    if (message.isPending()) message.reject(reason);
  };

  try {
    const result = handler(
      message.payload,
      message as WorkerMethodMessage<unknown>,
      event
    );

    if (isPromiseLike(result)) {
      result.then(resolve, reject);

      return;
    }

    resolve(result);
  } catch (error) {
    reject(error);
  }
};

/**
 * Defines the methods of a worker file, each key of the returned object is a method that can be called from the main thread.
 *
 * @example
 * const worker = defineWorker(({ onMessage }) => ({
 *   // the returned value resolves the message
 *   double: (value: number) => value * 2,
 *
 *   // the second parameter is the message (reportProgress, onCancel, ...) and the third one the event
 *   count: onMessage(async (to: number, message) => {
 *     message.reportProgress(50);
 *
 *     return to;
 *   }),
 *
 *   // receives only the message and completes it whenever it wants
 *   later: onMessage<number, string>().handle((message) => {
 *     setTimeout(() => message.resolve('done'), message.payload);
 *   }),
 * }));
 *
 * export type MyWorker = typeof worker;
 *
 * // main thread
 * const worker = createWorker<MyWorker>(new URL('./myWorker', import.meta.url));
 */
export const defineWorker = <TMethods extends WorkerMethods>(
  builder: (helpers: WorkerHelpers) => TMethods
): WorkerDefinition<TMethods> => {
  const worker: IEasyWorkerInstance = new StaticEasyWebWorker();
  const methods = builder({ onMessage });

  Object.keys(methods).forEach((name) => {
    const method = methods[name];

    if (typeof method === 'function') {
      worker.onMessage<unknown, unknown>(name, (message, event) => {
        executeMethod(method, message, event);
      });

      return;
    }

    worker.onMessage<unknown, unknown>(name, method.handle);
  });

  return { [workerInstance$]: worker };
};

export { unwrap } from './unwrap';
export type * from './types';

export default defineWorker;
