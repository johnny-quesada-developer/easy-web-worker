import {
  createWorker,
  unwrap,
  WorkerBuilder,
} from 'easy-web-worker/createWorker';

/**
 * Workers created from a function: createWorker(builder).
 * The function runs inside real worker threads, same as the runtime workers of EasyWebWorker.test.ts.
 */
describe('createWorker (function as source)', () => {
  it('should call the methods returned by the function', async () => {
    const math = createWorker(() => ({
      double: (value: number) => value * 2,

      fibonacci: (n: number) => {
        const fibonacci = (value: number): number =>
          value <= 1 ? value : fibonacci(value - 1) + fibonacci(value - 2);

        return fibonacci(n);
      },

      hello: () => 'hello',
    }));

    expect(await math.double(21)).toEqual(42);
    expect(await math.fibonacci(20)).toEqual(6765);
    expect(await math.hello()).toEqual('hello');

    await unwrap(math).dispose();
  });

  it('should resolve async methods and reject with what they throw', async () => {
    const worker = createWorker(() => ({
      sum: async (values: number[]) => {
        await new Promise((resolve) => setTimeout(resolve, 1));

        return values.reduce((total, value) => total + value, 0);
      },

      fail: (reason: string): string => {
        throw new Error(reason);
      },

      failAsync: async (reason: string): Promise<string> => {
        throw new TypeError(reason);
      },
    }));

    expect(await worker.sum([1, 2, 3, 4])).toEqual(10);

    const error = (await worker
      .fail('method error')
      .catch((reason) => reason)) as Error;

    const asyncError = (await worker
      .failAsync('async error')
      .catch((reason) => reason)) as TypeError;

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual('method error');
    expect(asyncError).toBeInstanceOf(TypeError);
    expect(asyncError.message).toEqual('async error');

    /* the worker is still healthy */
    expect(await worker.sum([1, 1])).toEqual(2);

    await unwrap(worker).dispose();
  });

  it('should keep the state of the worker between calls', async () => {
    const counter = createWorker(() => {
      let count = 0;

      return {
        increment: () => ++count,
        add: (value: number) => (count += value),
      };
    });

    expect(await counter.increment()).toEqual(1);
    expect(await counter.increment()).toEqual(2);
    expect(await counter.add(10)).toEqual(12);

    await unwrap(counter).dispose();
  });

  it('should report progress and receive the event with onMessage', async () => {
    const worker = createWorker(({ onMessage }) => ({
      count: onMessage((steps: number, message, event) => {
        for (let step = 1; step <= steps; step++) {
          message.reportProgress((step * 100) / steps, step);
        }

        return `${message.method}:${event.data.messageId === message.messageId}`;
      }),
    }));

    const progressLogger = vi.fn();

    const result = await worker.count(4).onProgress(progressLogger);

    expect(result).toEqual('count:true');
    expect(progressLogger.mock.calls).toEqual([
      [25, 1],
      [50, 2],
      [75, 3],
      [100, 4],
    ]);

    await unwrap(worker).dispose();
  });

  it('should cancel a method and execute its cancelation callbacks', async () => {
    const worker = createWorker(({ onMessage }) => {
      let canceled = 0;

      return {
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

    const errorLogger = vi.fn();

    await worker.slow(5000).cancel('canceled').catch(errorLogger);

    expect(errorLogger).toHaveBeenCalledWith('canceled');
    expect(await worker.getCanceled()).toEqual(1);
    expect(await worker.slow(1)).toEqual('done');

    await unwrap(worker).dispose();
  });

  it('should transfer buffers in both directions', async () => {
    const worker = createWorker(({ onMessage }) => ({
      grow: onMessage<ArrayBuffer, ArrayBuffer>().handle((message) => {
        const buffer = new ArrayBuffer(message.payload.byteLength * 2);

        message.resolve(buffer, [buffer]);
      }),
    }));

    const buffer = new ArrayBuffer(512);
    const result = await worker.grow(buffer, [buffer]);

    expect(result.byteLength).toEqual(1024);
    expect(buffer.byteLength).toEqual(0);

    await unwrap(worker).dispose();
  });

  it('should receive the scope of the worker and the primitive parameters', async () => {
    const worker = createWorker(
      (_helpers, context) => {
        const [prefix, times] = context.primitiveParameters;

        context.shared = 'shared value';

        return {
          repeat: (text: string) => `${prefix}${text.repeat(times)}`,
          getShared: () => context.shared as string,
        };
      },
      {
        primitiveParameters: ['result: ', 2] as [string, number],
      }
    );

    expect(await worker.repeat('ab')).toEqual('result: abab');
    expect(await worker.getShared()).toEqual('shared value');

    await unwrap(worker).dispose();
  });

  it('should create a pool with its own state in each worker', async () => {
    const counter = createWorker(
      () => {
        let count = 0;

        return {
          increment: () => ++count,
        };
      },
      { maxWorkers: 2, warmUpWorkers: true }
    );

    const counters = await Promise.all(
      new Array(4).fill(null).map(() => counter.increment())
    );

    expect(counters.sort()).toEqual([1, 1, 2, 2]);
    expect(unwrap(counter).workers.length).toEqual(2);

    await unwrap(counter).dispose();
  });

  it('should reboot the worker and start from a clean state', async () => {
    const counter = createWorker(({ onMessage }) => {
      let count = 0;

      return {
        increment: () => ++count,
        block: onMessage<null, void>().handle(() => {}),
      };
    });

    await counter.increment();
    await counter.increment();

    const errorLogger = vi.fn();
    const blocked = counter.block().catch(errorLogger);

    await unwrap(counter).reboot('rebooted');
    await blocked;

    expect(errorLogger).toHaveBeenCalledWith('rebooted');
    expect(await counter.increment()).toEqual(1);

    await unwrap(counter).dispose();
  });

  it('should keep the message api available through easyWorker', async () => {
    const worker = createWorker<{
      double: (value: number) => number;
      triple: (value: number) => number;
    }>(({ easyWorker }) => {
      easyWorker.onMessage<number, number>('double', (message) => {
        message.resolve(message.payload * 2);
      });

      easyWorker.onMessage((message) => {
        message.resolve();
      });

      return {
        triple: (value: number) => value * 3,
      };
    });

    const defaultCallback = vi.fn();

    expect(await worker.double(21)).toEqual(42);
    expect(await worker.triple(21)).toEqual(63);

    await unwrap(worker).send(null).then(defaultCallback);

    expect(defaultCallback).toHaveBeenCalledTimes(1);

    await unwrap(worker).dispose();
  });

  it('should accept a function that only uses the message api', async () => {
    const worker = createWorker<{ uppercase: (text: string) => string }>(
      ({ easyWorker }) => {
        easyWorker.onMessage<string, string>('uppercase', (message) => {
          message.resolve(message.payload.toUpperCase());
        });
      }
    );

    expect(await worker.uppercase('text')).toEqual('TEXT');

    await unwrap(worker).dispose();
  });

  describe('collection of functions', () => {
    it('should merge the methods of every function', async () => {
      const worker = createWorker([
        () => ({
          double: (value: number) => value * 2,
        }),
        ({ onMessage }) => ({
          triple: onMessage((value: number) => value * 3),
        }),
      ]);

      expect(await worker.double(21)).toEqual(42);
      expect(await worker.triple(21)).toEqual(63);

      await unwrap(worker).dispose();
    });

    it('should use the last method when it is repeated', async () => {
      const first = () => ({
        name: () => 'first',
        onlyFirst: () => 'only first',
      });

      const second = () => ({
        name: () => 2,
      });

      const worker = createWorker([first, second]);

      expect(await worker.name()).toEqual(2);
      expect(await worker.onlyFirst()).toEqual('only first');

      await unwrap(worker).dispose();
    });

    it('should share the scope and the helpers between the functions', async () => {
      const first: WorkerBuilder = ({ easyWorker }, context) => {
        context.double = (value: number) => value * 2;

        easyWorker.onMessage<null, string>('legacy', (message) => {
          message.resolve(`legacy ${context.primitiveParameters[0]}`);
        });

        return {};
      };

      const second: WorkerBuilder = (_helpers, context) => {
        const double = context.double as (value: number) => number;

        return {
          double,
          quadruple: (value: number) => double(double(value)),
        };
      };

      const worker = createWorker<{
        double: (value: number) => number;
        quadruple: (value: number) => number;
        legacy: () => string;
      }>([first, second], { primitiveParameters: ['parameter'] });

      expect(await worker.double(2)).toEqual(4);
      expect(await worker.quadruple(2)).toEqual(8);
      expect(await worker.legacy()).toEqual('legacy parameter');

      await unwrap(worker).dispose();
    });
  });

  it('should ignore the values that are not methods', async () => {
    const onWorkerError = vi.fn();

    const worker = createWorker(() => ({ hello: () => 'hello' }), {
      onWorkerError,
    });

    expect(await worker.hello()).toEqual('hello');
    expect(onWorkerError).not.toHaveBeenCalled();

    await unwrap(worker).dispose();
  });
});
