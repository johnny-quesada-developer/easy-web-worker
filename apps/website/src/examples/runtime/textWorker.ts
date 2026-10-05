import { createWorker } from 'easy-web-worker/createWorker';

/**
 * A worker with no file: the function below is its source.
 * It cannot use anything from outside, so everything it needs is defined inside.
 */
export const createTextWorker = () =>
  createWorker(() => {
    const words = (text: string) => text.toLowerCase().match(/[a-z0-9']+/g) ?? [];

    return {
      analyze: (text: string) => {
        const all = words(text);
        const counts = new Map<string, number>();

        all.forEach((word) => {
          if (word.length > 3) counts.set(word, (counts.get(word) ?? 0) + 1);
        });

        const frequent = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 5)
          .map(([word, times]) => ({ word, times }));

        return {
          words: all.length,
          unique: new Set(all).size,
          characters: text.length,
          readingSeconds: Math.round((all.length / 230) * 60),
          frequent,
        };
      },
    };
  });

export type TextWorker = ReturnType<typeof createTextWorker>;
export type TextAnalysis = Awaited<ReturnType<TextWorker['analyze']>>;
