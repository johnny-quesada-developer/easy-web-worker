import { defineWorker } from 'easy-web-worker/defineWorker';

const isPrime = (candidate: number) => {
  for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
    if (candidate % divisor === 0) return false;
  }

  return candidate > 1;
};

const worker = defineWorker(({ onMessage }) => ({
  findPrimes: onMessage(async (limit: number, message) => {
    const primes: number[] = [];

    for (let candidate = 2; candidate <= limit; candidate++) {
      if (isPrime(candidate)) primes.push(candidate);

      if (candidate % 100_000 !== 0) continue;

      // give the worker a moment to receive a cancellation
      await new Promise((resolve) => setTimeout(resolve));

      if (!message.isPending()) break;

      message.reportProgress((candidate / limit) * 100);
    }

    return primes;
  }),
}));

export type PrimesWorker = typeof worker;
