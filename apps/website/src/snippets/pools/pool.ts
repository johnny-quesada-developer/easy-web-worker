import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from '../getting-started/math.worker?worker&url';
import type { MathWorker } from '../getting-started/math.worker';

const math = createWorker<MathWorker>(workerUrl, {
  maxWorkers: 4,
  workerOptions: { type: 'module' },
});

export function computeAll() {
  // three calls, three threads, at the same time
  return Promise.all([math.fibonacci(40), math.fibonacci(41), math.fibonacci(42)]);
}
