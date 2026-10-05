import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './collatz.worker?worker&url';
import type { CollatzWorker } from './collatz.worker';

/** The same worker file; `maxWorkers` decides how many native Workers share the calls. */
export const createCollatzWorker = (maxWorkers: number) =>
  createWorker<CollatzWorker>(workerUrl, {
    maxWorkers,
    warmUpWorkers: true,
    workerOptions: { type: 'module', name: 'worker' },
  });
