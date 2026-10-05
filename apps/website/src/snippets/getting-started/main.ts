import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './math.worker?worker&url';
import type { MathWorker } from './math.worker';

export const math = createWorker<MathWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

export async function compute() {
  // CancelablePromise<number>: the payload and the result are inferred
  const result = await math.fibonacci(40);

  return result; // 102334155
}
