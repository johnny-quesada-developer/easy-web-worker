import { defineWorker } from 'easy-web-worker/defineWorker';

const fibonacci = (n: number): number =>
  n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);

// every key of the returned object is a method of the worker
const worker = defineWorker(() => ({ fibonacci }));

// the main thread only needs this type
export type MathWorker = typeof worker;
