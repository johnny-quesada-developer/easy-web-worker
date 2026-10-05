import type { WorkerDefinition, WorkerHelpers, WorkerMethods } from './types';

import { buildWorker } from './buildWorker';
import { workerInstance$ } from './unwrap';

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
  const worker = buildWorker(({ onMessage }) => builder({ onMessage }));

  return { [workerInstance$]: worker };
};

export { unwrap } from './unwrap';
export type * from './types';

export default defineWorker;
