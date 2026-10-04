import { test, expect, expectPageErrors } from './fixtures';
import type { DefineWorker } from './harness/define.worker';

/**
 * These specs use a real worker file (harness/define.worker.ts) built with defineWorker
 * and call it from the page through createWorker.
 */
test.describe('defineWorker + createWorker', () => {
  test('should call the methods of the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl, {
        workerOptions: { name: 'defined' },
      });

      const result = {
        hello: await worker.hello('world'),
        name: await worker.name(),
        sum: await worker.sum([1, 2, 3, 4]),
        counters: [await worker.increment(), await worker.increment()],
        keys: Object.keys(worker),
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      hello: 'Hello world!',
      name: 'defined',
      sum: 10,
      counters: [1, 2],
      keys: [],
    });
  });

  test('should use a worker file from an URL object or a native worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl } = window.e2e;

      const fromUrl = createWorker<DefineWorker>(new URL(defineWorkerUrl));

      const nativeWorker = new Worker(defineWorkerUrl, { name: 'native' });
      const fromInstance = createWorker<DefineWorker>(nativeWorker);

      const result = {
        fromUrl: await fromUrl.hello('url'),
        fromInstance: await fromInstance.name(),
        isSameInstance: unwrap(fromInstance).workers[0] === nativeWorker,
      };

      await unwrap(fromUrl).dispose();
      await unwrap(fromInstance).dispose();

      return result;
    });

    expect(result).toEqual({
      fromUrl: 'Hello url!',
      fromInstance: 'native',
      isSameInstance: true,
    });
  });

  test('should create a pool of workers', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl, {
        maxWorkers: 2,
        warmUpWorkers: true,
      });

      const counters = await Promise.all(
        new Array(4).fill(null).map(() => worker.increment())
      );

      await unwrap(worker).dispose();

      return counters.sort();
    });

    expect(result).toEqual([1, 1, 2, 2]);
  });

  test('should report the progress of a method', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);
      const progress: unknown[] = [];

      const value = await worker.progress(4).onProgress((percentage, step) => {
        progress.push([percentage, step]);
      });

      await unwrap(worker).dispose();

      return { value, progress };
    });

    expect(result).toEqual({
      value: 4,
      progress: [
        [25, 1],
        [50, 2],
        [75, 3],
        [100, 4],
      ],
    });
  });

  test('should reject with what the method throws', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl, settle, describeError } = window.e2e;

      let workerErrors = 0;

      const worker = createWorker<DefineWorker>(defineWorkerUrl, {
        onWorkerError: () => {
          workerErrors += 1;
        },
      });

      const describe = async (promise: PromiseLike<unknown>) => {
        const settled = await settle(promise);

        return settled.status === 'rejected'
          ? describeError(settled.reason)
          : settled.status;
      };

      const result = {
        text: await describe(worker.reject('rejected')),
        error: await describe(worker.rejectWithError()),
        asyncError: await describe(worker.rejectAsync('out of range')),

        // the worker is still healthy
        hello: await worker.hello('again'),
        workerErrors,
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      text: { isError: false, value: 'rejected' },
      error: { isError: true, name: 'TypeError', message: 'worker type error' },
      asyncError: { isError: true, name: 'RangeError', message: 'out of range' },
      hello: 'Hello again!',

      // an error thrown by a method rejects its message, it is not a worker error
      workerErrors: 0,
    });
  });

  test('should cancel the methods from the main thread and from the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl, settle } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);

      const slow = worker.slow(5000);

      slow.cancel('first');
      slow.cancel('second');

      const result = {
        handled: await settle(slow),
        asyncMethod: await settle(worker.slowAsync(5000).cancel('canceled')),
        fromWorker: await settle(worker.cancelFromWorker('canceled by worker')),
        completed: await settle(worker.slow(10)),
        state: await worker.getState(),
      };

      await unwrap(worker).dispose();

      return result;
    });

    expect(result).toEqual({
      handled: { status: 'rejected', reason: 'first' },
      asyncMethod: { status: 'rejected', reason: 'canceled' },
      fromWorker: { status: 'rejected', reason: 'canceled by worker' },
      completed: { status: 'resolved', value: 'done' },
      state: { counter: 0, canceled: 2, finalized: 2 },
    });
  });

  test('should only deliver the first completion of a message', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl, wait } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);
      const progress: number[] = [];

      const value = await worker.completeTwice().onProgress((percentage) => {
        progress.push(percentage);
      });

      await wait(50);

      const next = await worker.hello('again');

      await unwrap(worker).dispose();

      return { value, next, progress };
    });

    expect(result).toEqual({ value: 'first', next: 'Hello again!', progress: [] });
  });

  test('should transfer buffers in both directions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);
      const buffer = new ArrayBuffer(512);

      const { received, buffer: returned } = await worker.transfer(buffer, [
        buffer,
      ]);

      await unwrap(worker).dispose();

      return { received, returned: returned.byteLength, sent: buffer.byteLength };
    });

    expect(result).toEqual({ received: 512, returned: 1024, sent: 0 });
  });

  test('should import scripts from inside the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl, scriptUrl } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);
      const value = await worker.importScripts(scriptUrl('add'));

      await unwrap(worker).dispose();

      return value;
    });

    expect(result).toEqual(5);
  });

  test('close should reject the pending messages of the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker } = window.easyWebWorker;
      const { defineWorkerUrl, settle, describeError } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);

      const settled = await Promise.all([
        settle(worker.slow(5000)),
        settle(worker.slow(5000)),
        settle(worker.close()),
      ]);

      return settled.map((item) =>
        item.status === 'rejected' ? describeError(item.reason) : item.status
      );
    });

    expect(result).toEqual(
      new Array(3).fill({
        isError: true,
        name: 'Error',
        message: 'worker closed',
      })
    );
  });

  test('unwrap should give access to the api of the EasyWebWorker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createWorker, unwrap, EasyWebWorker } = window.easyWebWorker;
      const { defineWorkerUrl, settle } = window.e2e;

      const worker = createWorker<DefineWorker>(defineWorkerUrl);
      const instance = unwrap(worker);

      await worker.increment();
      await worker.increment();

      const pending = [settle(worker.slow(5000)), settle(worker.slow(5000))];

      await instance.cancelAll('cancel all');

      const canceled = await Promise.all(pending);
      const counterAfterCancelAll = await worker.increment();

      const blocked = settle(worker.slow(5000));

      await instance.reboot('rebooted');

      const rebooted = await blocked;

      // a new worker means a new state
      const counterAfterReboot = await worker.increment();

      const byName = await instance.sendToMethod<string, string>(
        'hello',
        'by name'
      );

      await instance.dispose();

      return {
        isEasyWebWorker: instance instanceof EasyWebWorker,
        canceled,
        counterAfterCancelAll,
        rebooted,
        counterAfterReboot,
        byName,
        workers: instance.workers.length,
      };
    });

    expect(result).toEqual({
      isEasyWebWorker: true,
      canceled: new Array(2).fill({ status: 'rejected', reason: 'cancel all' }),
      counterAfterCancelAll: 3,
      rebooted: { status: 'rejected', reason: 'rebooted' },
      counterAfterReboot: 1,
      byName: 'Hello by name!',
      workers: 0,
    });
  });

  test('should report an error when the method does not exist in the worker', async ({
    page,
  }) => {
    expectPageErrors();

    const result = await page.evaluate(async () => {
      const { createWorker, unwrap } = window.easyWebWorker;
      const { defineWorkerUrl, settleWithin } = window.e2e;

      let workerErrors = 0;

      const worker = createWorker<DefineWorker>(defineWorkerUrl, {
        onWorkerError: () => {
          workerErrors += 1;
        },
      });

      await settleWithin(unwrap(worker).sendToMethod('missing'), 300);

      // the worker is still healthy
      const value = await worker.hello('after errors');

      return { workerErrors, value };
    });

    expect(result).toEqual({ workerErrors: 1, value: 'Hello after errors!' });
  });
});
