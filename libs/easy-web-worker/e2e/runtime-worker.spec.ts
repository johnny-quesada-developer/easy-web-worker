import { test, expect } from './fixtures';

/**
 * Workers created from a function with createWorker(builder): no worker file, methods and types from the function.
 */
test.describe('createWorker with a function as source', () => {
  test('should call the methods returned by the function', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;

      const math = createWorker(() => {
        const fibonacci = (n: number): number =>
          n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);

        let calls = 0;

        return {
          fibonacci: (n: number) => {
            calls += 1;

            return fibonacci(n);
          },

          sum: async (values: number[]) => {
            await new Promise((resolve) => setTimeout(resolve, 5));

            return values.reduce((total, value) => total + value, 0);
          },

          getCalls: () => calls,
        };
      });

      const result = {
        fibonacci: await math.fibonacci(25),
        sum: await math.sum([1, 2, 3, 4]),
        calls: await math.getCalls(),
        isBlobUrl: String(unwrap(math).workerUrl).startsWith('blob:'),
        keys: Object.keys(math),
      };

      await unwrap(math).dispose();

      return result;
    });

    expect(result).toEqual({
      fibonacci: 75025,
      sum: 10,
      calls: 1,
      isBlobUrl: true,
      keys: [],
    });
  });

  test('should run the function outside of the main thread', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;

      const worker = createWorker(() => ({
        block: (milliseconds: number) => {
          const start = Date.now();

          while (Date.now() - start < milliseconds) {}

          return Date.now() - start;
        },
      }));

      let ticks = 0;

      const intervalId = setInterval(() => {
        ticks += 1;
      }, 10);

      const blockedTime = await worker.block(400);

      clearInterval(intervalId);

      await unwrap(worker).dispose();

      return { ticks, blockedTime };
    });

    expect(result.blockedTime).toBeGreaterThanOrEqual(400);
    expect(result.ticks).toBeGreaterThan(10);
  });

  test('should reject with what the methods throw', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { settle, describeError } = window.e2e;

      let workerErrors = 0;

      const worker = createWorker(
        () => ({
          fail: (reason: string): void => {
            throw new RangeError(reason);
          },

          failAsync: async (reason: string): Promise<void> => {
            throw reason;
          },

          hello: () => 'hello',
        }),
        {
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      const failed = await settle(worker.fail('out of range'));
      const failedAsync = await settle(worker.failAsync('async reason'));

      const result = {
        failed:
          failed.status === 'rejected'
            ? describeError(failed.reason)
            : failed.status,
        failedAsync,
        hello: await worker.hello(),
        workerErrors,
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      failed: { isError: true, name: 'RangeError', message: 'out of range' },
      failedAsync: { status: 'rejected', reason: 'async reason' },
      hello: 'hello',
      workerErrors: 0,
    });
  });

  test('should report progress and cancel through the message', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createWorker(({ onMessage }) => {
        let canceled = 0;

        return {
          count: onMessage(async (steps: number, message) => {
            for (let step = 1; step <= steps; step++) {
              await new Promise((resolve) => setTimeout(resolve, 1));

              if (!message.isPending()) break;

              message.reportProgress((step * 100) / steps, step);
            }

            return steps;
          }),

          slow: onMessage<number, string>().handle((message) => {
            const timeoutId = setTimeout(
              () => message.resolve('done'),
              message.payload
            );

            message.onCancel(() => {
              canceled += 1;

              clearTimeout(timeoutId);
            });
          }),

          getCanceled: () => canceled,
        };
      });

      const progress: unknown[] = [];

      const count = await worker.count(4).onProgress((percentage, step) => {
        progress.push([percentage, step]);
      });

      const slow = worker.slow(5000);

      slow.cancel('first');
      slow.cancel('second');

      const result = {
        count,
        progress,
        canceledCall: await settle(slow),
        canceled: await worker.getCanceled(),
        completed: await worker.slow(5),
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      count: 4,
      progress: [
        [25, 1],
        [50, 2],
        [75, 3],
        [100, 4],
      ],
      canceledCall: { status: 'rejected', reason: 'first' },
      canceled: 1,
      completed: 'done',
    });
  });

  test('should transfer buffers in both directions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;

      const worker = createWorker(({ onMessage }) => ({
        grow: onMessage<ArrayBuffer, ArrayBuffer>().handle((message) => {
          const buffer = new ArrayBuffer(message.payload.byteLength * 2);

          message.resolve(buffer, [buffer]);
        }),
      }));

      const buffer = new ArrayBuffer(512);
      const returned = await worker.grow(buffer, [buffer]);

      await unwrap(worker).dispose();

      return { returned: returned.byteLength, sent: buffer.byteLength };
    });

    expect(result).toEqual({ returned: 1024, sent: 0 });
  });

  test('should receive the scope, the scripts and the primitive parameters', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { scriptUrl } = window.e2e;

      const worker = createWorker(
        (_helpers, context) => {
          const [prefix, factor] = context.primitiveParameters;

          const add = context.add as (a: number, b: number) => number;
          const multiply = context.multiply as typeof add;

          return {
            calculate: (value: number) =>
              `${prefix}${multiply(add(value, 1), factor)}`,

            getName: () => context.name,
          };
        },
        {
          scripts: [scriptUrl('add'), scriptUrl('multiply')],
          primitiveParameters: ['result: ', 10] as [string, number],
          workerOptions: { name: 'runtime' },
        }
      );

      const result = {
        calculated: await worker.calculate(2),
        name: await worker.getName(),
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({ calculated: 'result: 30', name: 'runtime' });
  });

  test('should keep the message api available through easyWorker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;

      const worker = createWorker<{
        double: (value: number) => number;
        triple: (value: number) => number;
        whoAmI: () => string;
      }>(
        ({ easyWorker }, context) => {
          let defaultMessages = 0;

          easyWorker.onMessage<number, number>('double', (message) => {
            message.resolve(message.payload * 2);
          });

          easyWorker.onMessage<null, string>('whoAmI', (message) => {
            message.resolve(`${context.name}:${defaultMessages}`);
          });

          easyWorker.onMessage((message) => {
            defaultMessages += 1;

            message.resolve();
          });

          return {
            triple: (value: number) => value * 3,
          };
        },
        { workerOptions: { name: 'mixed' } }
      );

      await unwrap(worker).send(null);

      const result = {
        double: await worker.double(21),
        triple: await worker.triple(21),
        whoAmI: await worker.whoAmI(),
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      double: 42,
      triple: 63,
      whoAmI: 'mixed:1',
    });
  });

  test('should merge a collection of functions into one worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;

      const worker = createWorker(
        [
          (_helpers, context) => {
            context.calls = 0;

            return {
              double: (value: number) => value * 2,
              name: () => 'first',
            };
          },
          ({ onMessage }, context) => ({
            triple: onMessage((value: number, message) => {
              context.calls = (context.calls as number) + 1;

              message.reportProgress(100);

              return value * 3;
            }),
          }),
          (_helpers, context) => ({
            name: () => `last, in ${context.name}`,
            getCalls: () => context.calls as number,
          }),
        ],
        { workerOptions: { name: 'merged' } }
      );

      const progress: number[] = [];

      const result = {
        double: await worker.double(21),
        triple: await worker.triple(21).onProgress((percentage) => {
          progress.push(percentage);
        }),
        name: await worker.name(),
        calls: await worker.getCalls(),
        progress,
        workers: unwrap(worker).workers.length,
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      double: 42,
      triple: 63,
      name: 'last, in merged',
      calls: 1,
      progress: [100],
      workers: 1,
    });
  });

  test('should scale to a pool, reboot and dispose', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { settle } = window.e2e;

      const canFetch = (url: string) =>
        fetch(url).then(
          (response) => response.ok,
          () => false
        );

      const counter = createWorker(
        ({ onMessage }) => {
          let count = 0;

          return {
            increment: () => ++count,
            block: onMessage<null, void>().handle(() => {}),
          };
        },
        { maxWorkers: 2, warmUpWorkers: true }
      );

      const instance = unwrap(counter);
      const workerUrl = String(instance.workerUrl);

      const counters = await Promise.all(
        new Array(4).fill(null).map(() => counter.increment())
      );

      const blocked = settle(counter.block());

      await instance.reboot('rebooted');

      const rebooted = await blocked;
      const afterReboot = await counter.increment();
      const workers = instance.workers.length;
      const availableBefore = await canFetch(workerUrl);

      await instance.dispose();

      return {
        counters: counters.sort(),
        rebooted,
        afterReboot,
        workers,
        availableBefore,
        availableAfter: await canFetch(workerUrl),
        workersAfterDispose: instance.workers.length,
      };
    });

    expect(result).toEqual({
      counters: [1, 1, 2, 2],
      rebooted: { status: 'rejected', reason: 'rebooted' },
      afterReboot: 1,
      workers: 2,
      availableBefore: true,
      availableAfter: false,
      workersAfterDispose: 0,
    });
  });
});
