import { fibonacci } from './responsive/math';
import { isPrime } from './progress/primes';
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
