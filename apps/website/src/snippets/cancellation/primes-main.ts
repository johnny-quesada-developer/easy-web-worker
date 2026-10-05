import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './primes.worker?worker&url';
import type { PrimesWorker } from './primes.worker';

export const math = createWorker<PrimesWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

export function search(progressBar: HTMLProgressElement, cancelButton: HTMLButtonElement) {
  const task = math.findPrimes(50_000_000).onProgress((percentage) => {
    progressBar.value = percentage;
  });

  cancelButton.onclick = () => task.cancel('Canceled by user');

  return task;
}
