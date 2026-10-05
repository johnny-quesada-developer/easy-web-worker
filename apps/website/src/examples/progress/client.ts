import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './primes.worker?worker&url';
import type { PrimesWorker } from './primes.worker';

export const createPrimesWorker = () =>
  createWorker<PrimesWorker>(workerUrl, {
    workerOptions: { type: 'module' },
  });
