import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './buffer.worker?worker&url';
import type { BufferWorker } from './buffer.worker';

export const createBufferWorker = () =>
  createWorker<BufferWorker>(workerUrl, {
    workerOptions: { type: 'module' },
  });
