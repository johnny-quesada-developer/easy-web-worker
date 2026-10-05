import { createWorker } from 'easy-web-worker/createWorker';

export const text = createWorker(
  (_helpers, context) => {
    // the script adds `Diff` to the scope of the worker
    const { diffWords } = context.Diff as {
      diffWords: (before: string, after: string) => unknown[];
    };

    return {
      compare: ({ before, after }: { before: string; after: string }) => diffWords(before, after),
    };
  },
  {
    scripts: ['https://cdn.jsdelivr.net/npm/diff@9.0.0/dist/diff.min.js'],
  },
);
