import { defineWorker } from 'easy-web-worker/defineWorker';

export const worker = defineWorker(() => ({
  fibonacci,
}));

function fibonacci(n: number): number {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}
