import { createWorker } from 'easy-web-worker/createWorker';
import type { MathWorker } from '../getting-started/math.worker';

// webpack 5, Parcel and Vite detect this expression and bundle the file
const nativeWorker = new Worker(new URL('../getting-started/math.worker.ts', import.meta.url), {
  type: 'module',
});

export const math = createWorker<MathWorker>(nativeWorker);
