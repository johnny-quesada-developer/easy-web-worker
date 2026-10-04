/**
 * Key that carries the worker behind the objects created by defineWorker and createWorker.
 * It is a registered symbol, so it is the same even if the package is loaded more than once (esm and cjs)
 * and the methods of a worker, which are strings, can never override it.
 */
export const workerInstance$: unique symbol = Symbol.for(
  'easy-web-worker/instance'
);

/**
 * Gives access to the worker behind the objects created by defineWorker and createWorker
 *
 * - Inside the worker file: unwrap(definition) returns the static worker (onMessage, close, importScripts)
 * - In the main thread: unwrap(worker) returns the EasyWebWorker instance (cancelAll, reboot, dispose, ...)
 */
export const unwrap = <TWorker extends { readonly [workerInstance$]: unknown }>(
  worker: TWorker
): TWorker[typeof workerInstance$] => {
  return worker[workerInstance$];
};

export default unwrap;
