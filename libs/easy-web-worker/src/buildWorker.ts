import type {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
  WorkerBuilder,
  WorkerDeferredHandler,
  WorkerMethodHandler,
  WorkerMethodMessage,
  WorkerMethods,
  WorkerOnMessage,
  WorkerScope,
} from './types';

import { StaticEasyWebWorker } from './StaticEasyWebWorker';
import { isTransferResult, transfer } from './transfer';

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
 * A result created with transfer(result, transferList) resolves with the result and transfers the objects in the list.
 * If the method already completed the message by itself (resolve with transferable objects, cancel, ...) nothing else is sent.
 */
const executeMethod = (
  handler: WorkerMethodHandler<unknown, unknown>,
  message: IEasyWebWorkerMessage<unknown, unknown>,
  event: MessageEvent<IMessageData<unknown>>
) => {
  const resolve = (result: unknown) => {
    if (!message.isPending()) return;

    if (isTransferResult(result)) {
      message.resolve(result.result, result.transferList);

      return;
    }

    message.resolve(result);
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
 * Internal: creates the worker and registers the methods returned by the builder.
 * It is the implementation behind defineWorker and behind the workers that createWorker creates from a function.
 */
export const buildWorker = (
  builder: WorkerBuilder<WorkerMethods | void>
): IEasyWorkerInstance => {
  const worker: IEasyWorkerInstance = new StaticEasyWebWorker();

  // a function that only uses the message api of easyWorker returns nothing
  const methods = (builder(
    { onMessage, transfer, easyWorker: worker },
    self as unknown as WorkerScope
  ) ?? {}) as WorkerMethods;

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

  return worker;
};

export default buildWorker;
