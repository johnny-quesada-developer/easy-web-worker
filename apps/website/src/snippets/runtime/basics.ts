import { createWorker } from 'easy-web-worker/createWorker';

export const math = createWorker(({ onMessage }) => {
  const fibonacci = (n: number): number =>
    n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);

  return {
    fibonacci,

    countTo: onMessage(async (limit: number, message) => {
      for (let step = 1; step <= limit; step++) {
        message.reportProgress((step * 100) / limit);
      }

      return limit;
    }),
  };
});

// both sides are in the same file, so there is no type to import
export const result = math.fibonacci(40); // CancelablePromise<number>
