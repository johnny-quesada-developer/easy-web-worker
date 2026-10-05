import { defineWorker } from 'easy-web-worker/defineWorker';

const fibonacci = (n: number): number =>
  n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);

const worker = defineWorker(() => ({ fibonacci }));

export type MathWorker = typeof worker;
