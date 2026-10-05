export interface Chain {
  /** The number the chain starts from. */
  start: number;
  /** How many steps it takes that number to reach 1. */
  steps: number;
}

/**
 * Collatz: halve an even number, turn an odd one into 3n + 1, repeat until 1.
 * Finds the number in `[from, to)` that takes the most steps. Every number has to be tried.
 * `onProgress` receives the percentage searched, about once per percent.
 */
export function longestChain(from: number, to: number, onProgress?: (percentage: number) => void): Chain {
  const longest: Chain = { start: Math.max(from, 1), steps: 0 };
  const every = Math.max(1, Math.floor((to - from) / 100));

  let nextReport = from + every;

  for (let candidate = longest.start; candidate < to; candidate++) {
    if (candidate === nextReport) {
      onProgress?.(((candidate - from) / (to - from)) * 100);
      nextReport += every;
    }

    let value = candidate;
    let steps = 0;

    while (value !== 1) {
      value = value % 2 === 0 ? value / 2 : 3 * value + 1;
      steps += 1;
    }

    if (steps > longest.steps) {
      longest.start = candidate;
      longest.steps = steps;
    }
  }

  return longest;
}

/** Splits `[0, limit)` in equal parts, one per task. */
export const segments = (limit: number, parts: number): [from: number, to: number][] =>
  Array.from({ length: parts }, (_, part) => [Math.floor((limit * part) / parts), Math.floor((limit * (part + 1)) / parts)]);
