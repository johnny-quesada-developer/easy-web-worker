import { createWorker } from 'easy-web-worker/createWorker';
import type { MathWorker } from '../getting-started/math.worker';

const createMathWorker = () =>
  new Worker(new URL('../getting-started/math.worker.ts', import.meta.url), { type: 'module' });

// the array is the pool: calls are distributed across these Workers
export const math = createWorker<MathWorker>([
  createMathWorker(),
  createMathWorker(),
  createMathWorker(),
]);
