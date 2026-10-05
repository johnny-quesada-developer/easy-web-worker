import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from '../getting-started/math.worker?worker&url';
import type { MathWorker } from '../getting-started/math.worker';

// create the whole pool up front, for the fastest first call
export const warm = () =>
  createWorker<MathWorker>(workerUrl, {
    maxWorkers: 4,
    warmUpWorkers: true,
    workerOptions: { type: 'module' },
  });

// terminate idle Workers after five seconds without work
export const frugal = () =>
  createWorker<MathWorker>(workerUrl, {
    maxWorkers: 4,
    keepAlive: false,
    terminationDelay: 5_000,
    workerOptions: { type: 'module' },
  });
