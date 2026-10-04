import { test, expect, expectPageErrors } from './fixtures';

/**
 * These specs use a real worker file (harness/static.worker.ts) built with createStaticEasyWebWorker.
 */
test.describe('static worker file', () => {
  test('should use a worker file from a string url', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = new EasyWebWorker<string, string>(staticWorkerUrl);

      const value = await worker.send('world');
      const sameUrl = worker.workerUrl === staticWorkerUrl;

      await worker.dispose();

      return { value, sameUrl };
    });

    expect(result).toEqual({ value: 'Hello world!', sameUrl: true });
  });

  test('should use a worker file from an URL object', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = createEasyWebWorker<string, string>(
        new URL(staticWorkerUrl)
      );

      const value = await worker.send('url');

      await worker.dispose();

      return value;
    });

    expect(result).toEqual('Hello url!');
  });

  test('should use a native worker instance', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, describeError } = window.e2e;

      const nativeWorker = new Worker(staticWorkerUrl, { name: 'native' });
      const worker = new EasyWebWorker<string, string>(nativeWorker);

      const value = await worker.send('instance');
      const name = await worker.sendToMethod<string>('name');

      let rebootError: unknown = null;

      try {
        worker.reboot();
      } catch (error) {
        rebootError = describeError(error);
      }

      const result = {
        value,
        name,
        rebootError,
        workerUrl: worker.workerUrl,
        isSameInstance: worker.workers[0] === nativeWorker,
        keepAlive: worker.config.keepAlive,
      };

      await worker.dispose();

      return result;
    });

    expect(result).toEqual({
      value: 'Hello instance!',
      name: 'native',
      rebootError: {
        isError: true,
        name: 'Error',
        message:
          'You can not reboot a worker that was created from a Worker Instance',
      },
      workerUrl: null,
      isSameInstance: true,
      keepAlive: true,
    });
  });

  test('should use a collection of native worker instances', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = new EasyWebWorker<string, string>(
        [
          new Worker(staticWorkerUrl, { name: 'first' }),
          new Worker(staticWorkerUrl, { name: 'second' }),
        ],
        { keepAlive: false }
      );

      const names = [];

      for (let index = 0; index < 4; index++) {
        names.push(await worker.sendToMethod<string>('name'));
      }

      const result = {
        names,
        maxWorkers: worker.config.maxWorkers,
        keepAlive: worker.config.keepAlive,
        workers: worker.workers.length,
      };

      await worker.dispose();

      return result;
    });

    expect(result).toEqual({
      names: ['first', 'second', 'first', 'second'],
      maxWorkers: 2,

      // the library can not create these workers again, so they are never terminated
      keepAlive: true,
      workers: 2,
    });
  });

  test('should create a pool from a worker file', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl, {
        maxWorkers: 2,
        warmUpWorkers: true,
      });

      const counters = await Promise.all(
        new Array(4).fill(null).map(() => worker.sendToMethod<number>('increment'))
      );

      await worker.dispose();

      return counters.sort();
    });

    expect(result).toEqual([1, 1, 2, 2]);
  });

  test('should report the progress of a method', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);
      const progress: unknown[] = [];

      const value = await worker
        .sendToMethod<number, number>('progress', 4)
        .onProgress((percentage, step) => {
          progress.push([percentage, step]);
        });

      await worker.dispose();

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

  test('should execute the cancelation callbacks of the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settle } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);

      const canceled = await settle(
        worker.sendToMethod<string, number>('slow', 5000).cancel('canceled')
      );

      const completed = await settle(
        worker.sendToMethod<string, number>('slow', 10)
      );

      const state = await worker.sendToMethod('getState');

      await worker.dispose();

      return { canceled, completed, state };
    });

    expect(result).toEqual({
      canceled: { status: 'rejected', reason: 'canceled' },
      completed: { status: 'resolved', value: 'done' },
      state: { counter: 0, canceled: 1, finalized: 2 },
    });
  });

  test('should ignore the cancelation of a message that is not pending', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settle, wait } = window.e2e;

      let workerErrors = 0;

      const worker = new EasyWebWorker<string, string>(staticWorkerUrl, {
        onWorkerError: () => {
          workerErrors += 1;
        },
      });

      const completed = worker.send('world');
      const value = await completed;

      // already completed
      completed.cancel('late');

      const slow = worker.sendToMethod<string, number>('slow', 5000);

      slow.cancel('first');
      slow.cancel('second');

      const settled = await settle(slow);

      // straight to the worker, without the checks of the main thread
      worker.workers[0].postMessage({
        messageId: 'unknown',
        __is_easy_web_worker_message__: true,
        cancelation: { reason: 'reason' },
      });

      await wait(100);

      const state = await worker.sendToMethod('getState');

      await worker.dispose();

      return { value, settled, state, workerErrors };
    });

    expect(result).toEqual({
      value: 'Hello world!',
      settled: { status: 'rejected', reason: 'first' },
      state: { counter: 0, canceled: 1, finalized: 1 },
      workerErrors: 0,
    });
  });

  test('should reject and cancel from the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settle, describeError } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);

      const rejected = await settle(worker.sendToMethod('reject', 'rejected'));
      const canceled = await settle(
        worker.sendToMethod('cancelFromWorker', 'canceled')
      );

      const withError = await settle(worker.sendToMethod('rejectWithError'));

      await worker.dispose();

      return {
        rejected,
        canceled,
        withError:
          withError.status === 'rejected'
            ? describeError(withError.reason)
            : withError.status,
      };
    });

    expect(result).toEqual({
      rejected: { status: 'rejected', reason: 'rejected' },
      canceled: { status: 'rejected', reason: 'canceled' },
      withError: {
        isError: true,
        name: 'TypeError',
        message: 'worker type error',
      },
    });
  });

  test('should only deliver the first completion of a message', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, wait } = window.e2e;

      const worker = new EasyWebWorker<string, string>(staticWorkerUrl);
      const progress: number[] = [];

      const value = await worker
        .sendToMethod<string>('completeTwice')
        .onProgress((percentage) => {
          progress.push(percentage);
        });

      await wait(50);

      // the worker is still healthy
      const next = await worker.send('again');

      await worker.dispose();

      return { value, next, progress };
    });

    expect(result).toEqual({
      value: 'first',
      next: 'Hello again!',
      progress: [],
    });
  });

  test('should transfer buffers in both directions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);
      const buffer = new ArrayBuffer(512);

      const { received, buffer: returned } = await worker.sendToMethod<
        { received: number; buffer: ArrayBuffer },
        ArrayBuffer
      >('transfer', buffer, [buffer]);

      await worker.dispose();

      return {
        received,
        returned: returned.byteLength,
        sent: buffer.byteLength,
      };
    });

    expect(result).toEqual({ received: 512, returned: 1024, sent: 0 });
  });

  test('should ignore the messages that are not from the library', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, wait } = window.e2e;

      let workerErrors = 0;

      const worker = new EasyWebWorker<string, string>(staticWorkerUrl, {
        onWorkerError: () => {
          workerErrors += 1;
        },
      });

      const [nativeWorker] = worker.workers;

      // the worker should ignore these
      nativeWorker.postMessage('raw message');
      nativeWorker.postMessage({ some: 'value' });
      nativeWorker.postMessage({ messageId: 'no flag' });
      nativeWorker.postMessage(null);

      // the main thread should ignore the raw messages of the worker
      await worker.sendToMethod('postRawMessages');
      await wait(50);

      const value = await worker.send('still working');

      await worker.dispose();

      return { value, workerErrors };
    });

    expect(result).toEqual({ value: 'Hello still working!', workerErrors: 0 });
  });

  test('should import scripts from inside the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, scriptUrl } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);

      const value = await worker.sendToMethod<number, string>(
        'importScripts',
        scriptUrl('add')
      );

      await worker.dispose();

      return value;
    });

    expect(result).toEqual(5);
  });

  test('close should reject the pending messages of the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settle, describeError } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);

      const pending = [
        settle(worker.sendToMethod<string, number>('slow', 5000)),
        settle(worker.sendToMethod<string, number>('slow', 5000)),
        settle(worker.sendToMethod('close')),
      ];

      const settled = await Promise.all(pending);

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

  test('should report the errors of the worker to onWorkerError', async ({
    page,
  }) => {
    expectPageErrors();

    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settleWithin } = window.e2e;

      let workerErrors = 0;

      const worker = new EasyWebWorker<string, string>(staticWorkerUrl, {
        onWorkerError: () => {
          workerErrors += 1;
        },
      });

      await settleWithin(worker.sendToMethod('throw'), 300);
      await settleWithin(worker.sendToMethod('unknown method'), 300);

      // the worker is still healthy
      const value = await worker.send('after errors');

      return { workerErrors, value };
    });

    expect(result).toEqual({ workerErrors: 2, value: 'Hello after errors!' });
  });

  test('reboot should start a new worker from the file', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { EasyWebWorker } = window.easyWebWorker;
      const { staticWorkerUrl, settle } = window.e2e;

      const worker = new EasyWebWorker(staticWorkerUrl);

      await worker.sendToMethod('increment');
      await worker.sendToMethod('increment');

      const pending = settle(worker.sendToMethod<string, number>('slow', 5000));

      await worker.reboot('rebooted');

      const settled = await pending;
      const counter = await worker.sendToMethod<number>('increment');

      await worker.dispose();

      return { settled, counter };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'rebooted' },
      counter: 1,
    });
  });
});
