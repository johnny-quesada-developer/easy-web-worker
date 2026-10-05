import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './static.worker?worker&url';

// typed methods on top of a worker written with the message api
export const worker = createWorker<{ uppercase: (text: string) => string }>(workerUrl, {
  workerOptions: { type: 'module' },
});

export const upper = worker.uppercase('hello'); // CancelablePromise<string>
