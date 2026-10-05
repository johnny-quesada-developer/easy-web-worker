import { createWorker } from 'easy-web-worker/createWorker';
import type { MathWorker } from '../getting-started/math.worker';

// a worker script that is already built and public only needs its path
export const math = createWorker<MathWorker>('/workers/math.worker.js');
