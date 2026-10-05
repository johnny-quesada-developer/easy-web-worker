import { createWorker } from 'easy-web-worker/createWorker';

export const numbers = createWorker([
  // a reusable piece: leaves a helper in the scope of the worker
  (_helpers, context) => {
    context.round = (value: number) => Math.round(value * 100) / 100;
  },

  () => ({
    double: (value: number) => value * 2,
    describe: () => 'first',
  }),

  (_helpers, context) => {
    const round = context.round as (value: number) => number;

    return {
      average: (values: number[]) =>
        round(values.reduce((total, value) => total + value, 0) / values.length),

      // a repeated method: the last function wins
      describe: () => 'last',
    };
  },
]);
