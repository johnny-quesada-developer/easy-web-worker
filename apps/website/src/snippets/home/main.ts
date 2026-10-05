import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './math.worker?worker&url';
import type { MathWorker } from './math.worker';

const math = createWorker<MathWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

// typed as number, computed on another thread
export const result = await math.fibonacci(40);
