import { defineWorker } from 'easy-web-worker/defineWorker';
import { isPrime } from './primes';

/** How many numbers are checked before the worker pauses to listen for a cancellation. */
const CHUNK = 20_000;

const worker = defineWorker(({ onMessage }) => ({
  countPrimes: onMessage(async (limit: number, message) => {
    let found = 0;

    for (let candidate = 2; candidate <= limit; candidate++) {
      if (isPrime(candidate)) found += 1;

      if (candidate % CHUNK !== 0) continue;

      // a worker that never pauses cannot receive messages, including a cancellation
      await new Promise((resolve) => setTimeout(resolve));

      if (!message.isPending()) break;

      message.reportProgress((candidate / limit) * 100, { found });
    }

    return found;
  }),
}));

export type PrimesWorker = typeof worker;
