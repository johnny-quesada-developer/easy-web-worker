import { fibonacci } from './responsive/math';
import { isPrime } from './progress/primes';
import { longestChain, segments } from './pool/collatz';
import { createLog } from './shared/log';
import { count, megabytes, milliseconds } from './shared/format';

/**
 * The logic behind the examples, tested as ordinary functions.
 * The workers themselves run for real in visual/demos.spec.ts.
 */
describe('example logic', () => {
  it('computes fibonacci numbers', () => {
    expect([0, 1, 2, 3, 10, 20].map(fibonacci)).toEqual([0, 1, 1, 2, 55, 6765]);
  });

  it('recognizes prime numbers', () => {
    const primes = Array.from({ length: 30 }, (_, value) => value).filter(isPrime);

    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });

  it('finds the longest Collatz chain of a range', () => {
    expect(longestChain(0, 10)).toEqual({ start: 9, steps: 19 });
    expect(longestChain(1, 28)).toEqual({ start: 27, steps: 111 });
  });

  it('reports the progress of the search about once per percent', () => {
    const progress: number[] = [];

    expect(longestChain(1000, 2000, (percentage) => progress.push(percentage))).toEqual(longestChain(1000, 2000));
    expect(progress).toHaveLength(99);
    expect(progress[0]).toBe(1);
    expect(progress.at(-1)).toBe(99);
  });

  it('splits a limit in equal segments', () => {
    expect(segments(600_000, 3)).toEqual([
      [0, 200_000],
      [200_000, 400_000],
      [400_000, 600_000],
    ]);
  });

  it('formats the measured values', () => {
    expect(milliseconds(1019.6)).toBe('1,020 ms');
    expect(megabytes(64 * 1024 * 1024)).toBe('64 MB');
    expect(megabytes(0)).toBe('0 MB');
    expect(count(39088169)).toBe('39,088,169');
  });

  it('delivers the status line to its listeners until they unsubscribe', () => {
    const log = createLog();
    const listener = vi.fn();
    const stop = log.watch(listener);

    log.write('first');
    stop();
    log.write('second');

    expect(listener.mock.calls).toEqual([['first']]);
  });
});
