import { createWorker, type WorkerProxy } from 'easy-web-worker/createWorker';
import workerUrl from '../getting-started/math.worker?worker&url';
import type { MathWorker } from '../getting-started/math.worker';

// the type of what createWorker returns, for fields, props and parameters
let math: WorkerProxy<MathWorker> | null = null;

export const getMath = () =>
  (math ??= createWorker<MathWorker>(workerUrl, {
    workerOptions: { type: 'module' },
  }));

export const compute = (worker: WorkerProxy<MathWorker>) => worker.fibonacci(40);
