import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './crunch.worker?worker&url';
import type { CrunchWorker } from './crunch.worker';

/** The same worker file; `maxWorkers` decides how many native Workers share the calls. */
export const createCrunchWorker = (maxWorkers: number) =>
  createWorker<CrunchWorker>(workerUrl, {
    maxWorkers,
    warmUpWorkers: true,
    workerOptions: { type: 'module', name: 'worker' },
  });
