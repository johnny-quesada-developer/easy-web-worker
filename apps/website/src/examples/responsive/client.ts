import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './math.worker?worker&url';
import type { MathWorker } from './math.worker';

/** Only the type of the worker is imported here; its code is loaded by the browser as a Worker. */
export const createMathWorker = () =>
  createWorker<MathWorker>(workerUrl, {
    workerOptions: { type: 'module' },
  });
