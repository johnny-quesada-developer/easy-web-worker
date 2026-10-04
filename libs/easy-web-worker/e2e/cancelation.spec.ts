import { test, expect } from './fixtures';

test.describe('cancelation', () => {
  test('should cancel a message from the main thread', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        const state = { canceled: 0, finalized: 0, resolved: 0 };

        easyWorker.onMessage<null, string>('slow', (message) => {
          const timeoutId = setTimeout(() => {
            state.resolved += 1;

            message.resolve('done');
          }, 5000);

          message.onCancel(() => {
            state.canceled += 1;

            clearTimeout(timeoutId);
          });

          message.onFinalize(() => {
            state.finalized += 1;
          });
        });

        easyWorker.onMessage<null, typeof state>('getState', (message) => {
          message.resolve(state);
        });
      });

      const settled = await settle(
        worker.sendToMethod('slow').cancel('canceled by user')
      );

      const state = await worker.sendToMethod('getState');

      await worker.dispose();

      return { settled, state };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'canceled by user' },
      state: { canceled: 1, finalized: 1, resolved: 0 },
    });
  });

  test('should cancel a message from inside the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.cancel('canceled by worker');
        });
      });

      const settled = await settle(worker.send());

      await worker.dispose();

      return settled;
    });

    expect(result).toEqual({
      status: 'rejected',
      reason: 'canceled by worker',
    });
  });

  test('should only cancel the requested message', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker<string, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          const timeoutId = setTimeout(() => {
            message.resolve(message.payload);
          }, 100);

          message.onCancel(() => clearTimeout(timeoutId));
        });
      });

      const first = worker.send('first');
      const second = worker.send('second');
      const third = worker.send('third');

      second.cancel('canceled');

      const results = await Promise.all([first, second, third].map(settle));

      await worker.dispose();

      return results;
    });

    expect(result).toEqual([
      { status: 'resolved', value: 'first' },
      { status: 'rejected', reason: 'canceled' },
      { status: 'resolved', value: 'third' },
    ]);
  });

  test('should stop delivering the progress after the cancelation', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle, wait } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage((message) => {
          let progress = 0;

          const intervalId = setInterval(() => {
            progress += 1;

            message.reportProgress(progress);
          }, 5);

          message.onCancel(() => clearInterval(intervalId));
        });
      });

      let progressCount = 0;

      const promise = worker.send().onProgress(() => {
        progressCount += 1;
      });

      await wait(100);

      const settled = await settle(promise.cancel('canceled'));
      const progressAtCancelation = progressCount;

      await wait(100);

      await worker.dispose();

      return {
        settled,
        hadProgress: progressAtCancelation > 0,
        progressAfterCancelation: progressCount - progressAtCancelation,
      };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'canceled' },
      hadProgress: true,
      progressAfterCancelation: 0,
    });
  });

  test('should ignore the cancelation of a message that was already completed', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      let workerErrors = 0;

      const worker = createEasyWebWorker<null, string>(
        (easyWorker) => {
          easyWorker.onMessage((message) => {
            message.resolve('done');
          });
        },
        {
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      const promise = worker.send();
      const value = await promise;

      promise.cancel('too late');

      await wait(100);

      // the worker is still healthy
      const next = await worker.send();

      await worker.dispose();

      return { value, next, workerErrors };
    });

    expect(result).toEqual({ value: 'done', next: 'done', workerErrors: 0 });
  });

  test('should be idempotent', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle, wait } = window.e2e;

      let workerErrors = 0;

      const worker = createEasyWebWorker(
        (easyWorker) => {
          let canceled = 0;

          easyWorker.onMessage<null, string>('slow', (message) => {
            const timeoutId = setTimeout(() => message.resolve('done'), 5000);

            message.onCancel(() => {
              canceled += 1;

              clearTimeout(timeoutId);
            });
          });

          easyWorker.onMessage<null, number>('getCanceled', (message) => {
            message.resolve(canceled);
          });
        },
        {
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      const promise = worker.sendToMethod('slow');

      promise.cancel('first');
      promise.cancel('second');
      promise.cancel('third');

      const settled = await settle(promise);

      // already canceled
      promise.cancel('late');

      await wait(100);

      const canceled = await worker.sendToMethod('getCanceled');

      await worker.dispose();

      return { settled, canceled, workerErrors };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'first' },
      canceled: 1,
      workerErrors: 0,
    });
  });

  test('the worker should ignore the cancelation of an unknown message', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      let workerErrors = 0;

      const worker = createEasyWebWorker<null, string>(
        (easyWorker) => {
          easyWorker.onMessage((message) => {
            message.resolve('done');
          });
        },
        {
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      // straight to the worker, without the checks of the main thread
      worker.workers[0].postMessage({
        messageId: 'unknown',
        __is_easy_web_worker_message__: true,
        cancelation: { reason: 'reason' },
      });

      await wait(100);

      const value = await worker.send();

      await worker.dispose();

      return { value, workerErrors };
    });

    expect(result).toEqual({ value: 'done', workerErrors: 0 });
  });

  test('should cancel a message that was sent with transferable objects', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin, describeError } = window.e2e;

      const worker = createEasyWebWorker<ArrayBuffer, number>((easyWorker) => {
        easyWorker.onMessage((message) => {
          const timeoutId = setTimeout(() => {
            message.resolve(message.payload.byteLength);
          }, 5000);

          message.onCancel(() => clearTimeout(timeoutId));
        });
      });

      const buffer = new ArrayBuffer(64);
      const promise = worker.send(buffer, [buffer]);

      let cancelError: unknown = null;

      try {
        promise.cancel('canceled');
      } catch (error) {
        cancelError = describeError(error);
      }

      const settled = await settleWithin(promise, 1000);

      return { cancelError, settled };
    });

    expect(result).toEqual({
      cancelError: null,
      settled: { status: 'rejected', reason: 'canceled' },
    });
  });

  test('cancelAll should cancel every message and keep the worker alive', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        let counter = 0;

        easyWorker.onMessage<null, string>('slow', (message) => {
          const timeoutId = setTimeout(() => message.resolve('done'), 5000);

          message.onCancel(() => clearTimeout(timeoutId));
        });

        easyWorker.onMessage<null, number>('increment', (message) => {
          counter += 1;

          message.resolve(counter);
        });
      });

      await worker.sendToMethod('increment');

      const messages = [
        worker.sendToMethod('slow'),
        worker.sendToMethod('slow'),
        worker.sendToMethod('slow'),
      ].map(settle);

      const progress: unknown[] = [];

      const cancelAllResult = await worker
        .cancelAll('cancel all')
        .onProgress((percentage, reason) => {
          progress.push([Math.round(percentage), reason]);
        });

      const settled = await Promise.all(messages);

      // the state of the worker was not lost
      const counter = await worker.sendToMethod('increment');

      await worker.dispose();

      return {
        settled,
        counter,
        progress,
        cancelAllResult: typeof cancelAllResult,
      };
    });

    expect(result).toEqual({
      settled: new Array(3).fill({ status: 'rejected', reason: 'cancel all' }),
      counter: 2,
      progress: [
        [33, 'cancel all'],
        [33, 'cancel all'],
        [33, 'cancel all'],
      ],
      cancelAllResult: 'undefined',
    });
  });

  test('cancelAll should resolve when there are no messages', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage((message) => message.resolve());
      });

      const settled = await settleWithin(worker.cancelAll(), 1000);
      const forced = await settleWithin(
        worker.cancelAll('reason', { force: true }),
        1000
      );

      await worker.dispose();

      return [settled.status, forced.status];
    });

    expect(result).toEqual(['resolved', 'resolved']);
  });

  test('cancelAll with force should reboot the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        let counter = 0;

        easyWorker.onMessage<null, void>('block', () => {
          // never completes and never listens to the cancelation
        });

        easyWorker.onMessage<null, number>('increment', (message) => {
          counter += 1;

          message.resolve(counter);
        });
      });

      await worker.sendToMethod('increment');

      const blocked = settle(worker.sendToMethod('block'));

      await worker.cancelAll('forced', { force: true });

      const settled = await blocked;

      // a new worker means a new state
      const counter = await worker.sendToMethod('increment');

      await worker.dispose();

      return { settled, counter };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'forced' },
      counter: 1,
    });
  });
});

test.describe('override', () => {
  test('should cancel the previous messages and resolve the new one', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker<string, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          const timeoutId = setTimeout(() => {
            message.resolve(message.payload);
          }, 100);

          message.onCancel(() => clearTimeout(timeoutId));
        });
      });

      const previous = [worker.send('first'), worker.send('second')].map(settle);
      const last = await worker.override('last', 'overridden');

      const settled = await Promise.all(previous);

      await worker.dispose();

      return { settled, last };
    });

    expect(result).toEqual({
      settled: new Array(2).fill({ status: 'rejected', reason: 'overridden' }),
      last: 'last',
    });
  });

  test('should reboot the worker when is forced', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker<string, string>((easyWorker) => {
        let counter = 0;

        easyWorker.onMessage((message) => {
          counter += 1;

          if (message.payload === 'block') return;

          message.resolve(`${message.payload}:${counter}`);
        });
      });

      const blocked = settle(worker.send('block'));
      const last = await worker.override('last', 'overridden', { force: true });

      const settled = await blocked;

      await worker.dispose();

      return { settled, last };
    });

    expect(result).toEqual({
      settled: { status: 'rejected', reason: 'overridden' },

      // the counter starts again in the new worker
      last: 'last:1',
    });
  });

  test('overrideAfterCurrent should keep the current message and cancel the rest', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker<string, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          const timeoutId = setTimeout(() => {
            message.resolve(message.payload);
          }, 100);

          message.onCancel(() => clearTimeout(timeoutId));
        });
      });

      const previous = [
        worker.send('current'),
        worker.send('second'),
        worker.send('third'),
      ].map(settle);

      const last = await worker.overrideAfterCurrent('last', 'overridden');

      const settled = await Promise.all(previous);

      await worker.dispose();

      return { settled, last };
    });

    expect(result).toEqual({
      settled: [
        { status: 'resolved', value: 'current' },
        { status: 'rejected', reason: 'overridden' },
        { status: 'rejected', reason: 'overridden' },
      ],
      last: 'last',
    });
  });

  test('overrideAfterCurrent should send the message when the queue is empty', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<string, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve(message.payload);
        });
      });

      const result = await worker.overrideAfterCurrent('only');

      await worker.dispose();

      return result;
    });

    expect(result).toEqual('only');
  });
});
