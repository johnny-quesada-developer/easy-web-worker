import { createWorker } from 'easy-web-worker/createWorker';
import type { worker as MathWorker } from './math.worker';
import mathWorkerUrl from './math.worker?worker&url';

const mathWorker = createWorker<typeof MathWorker>(mathWorkerUrl);

// typed as number, computed on another thread
export const result = await mathWorker.fibonacci(40); // 102334155
