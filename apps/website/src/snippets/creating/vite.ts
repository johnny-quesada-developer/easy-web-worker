import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from '../getting-started/math.worker?worker&url';
import type { MathWorker } from '../getting-started/math.worker';

// `?worker&url` asks Vite to build the worker and hand back its URL
export const math = createWorker<MathWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});
