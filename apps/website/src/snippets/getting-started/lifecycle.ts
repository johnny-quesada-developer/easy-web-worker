import { unwrap } from 'easy-web-worker/createWorker';
import { math } from './main';

export function start(onProgress: (percentage: number) => void) {
  const task = math.fibonacci(42).onProgress(onProgress);

  // stop waiting for it, and tell the worker
  const cancel = () => task.cancel('No longer needed');

  return { task, cancel };
}

// when the feature that owns the worker goes away
export const dispose = () => unwrap(math).dispose();
