import { test, expect, expectPageErrors } from './fixtures';

test.describe('workers pool', () => {
  test('should give the configured name to the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, string>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            message.resolve(context.name);
          });
        },
        { workerOptions: { name: 'my-worker' } }
      );

      const name = await worker.send();

      await worker.dispose();

      return name;
    });

    expect(result).toEqual('my-worker');
  });

  test('should run the messages in parallel in different workers', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, string>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            const start = Date.now();

            // blocks the thread of the worker
            while (Date.now() - start < message.payload) {}

            message.resolve(context.name);
          });
        },
        {
          maxWorkers: 3,
          warmUpWorkers: true,
          workerOptions: { name: 'pool' },
        }
      );

      // the workers need to be ready before measuring
      await Promise.all([worker.send(0), worker.send(0), worker.send(0)]);

      const start = Date.now();

      const names = await Promise.all([
        worker.send(400),
        worker.send(400),
        worker.send(400),
      ]);

      const elapsed = Date.now() - start;

      await worker.dispose();

      return {
        workers: worker.config.maxWorkers,
        differentWorkers: new Set(names).size,
        elapsed,
      };
    });

    expect(result.workers).toEqual(3);
    expect(result.differentWorkers).toEqual(3);

    // one after another would take 1200ms
    expect(result.elapsed).toBeLessThan(1000);
  });

  test('should give a different name to each worker of the pool', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, string>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            message.resolve(context.name);
          });
        },
        {
          maxWorkers: 3,
          warmUpWorkers: true,
          workerOptions: { name: 'pool' },
        }
      );

      const names = await Promise.all([
        worker.send(),
        worker.send(),
        worker.send(),
      ]);

      await worker.dispose();

      return names.sort();
    });

    expect(result).toEqual(['pool', 'pool-1', 'pool-2']);
  });

  test('should create the workers on demand', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, void>(
        (easyWorker) => {
          easyWorker.onMessage((message) => {
            setTimeout(() => message.resolve(), 50);
          });
        },
        { maxWorkers: 3, keepAlive: true }
      );

      const workers = [worker.workers.length];
      const messages = [];

      for (let index = 0; index < 5; index++) {
        messages.push(worker.send());

        workers.push(worker.workers.length);
      }

      await Promise.all(messages);
      await worker.dispose();

      return workers;
    });

    // no workers until the first message, and never more than the maximum
    expect(result).toEqual([0, 1, 2, 3, 3, 3]);
  });

  test('should distribute the messages between the workers', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, number>(
        (easyWorker) => {
          let counter = 0;

          easyWorker.onMessage((message) => {
            counter += 1;

            message.resolve(counter);
          });
        },
        { maxWorkers: 2, warmUpWorkers: true }
      );

      const counters = await Promise.all(
        new Array(6).fill(null).map(() => worker.send())
      );

      await worker.dispose();

      return counters.sort();
    });

    // each worker has its own state and received half of the messages
    expect(result).toEqual([1, 1, 2, 2, 3, 3]);
  });

  test('should resolve a large amount of messages', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, number>(
        (easyWorker) => {
          easyWorker.onMessage((message) => {
            message.reportProgress(50);
            message.resolve(message.payload * 2);
          });
        },
        { maxWorkers: 4, warmUpWorkers: true }
      );

      let progressCount = 0;

      const results = await Promise.all(
        new Array(2000).fill(null).map((_, index) =>
          worker.send(index).onProgress(() => {
            progressCount += 1;
          })
        )
      );

      await worker.dispose();

      return {
        allMatch: results.every((value, index) => value === index * 2),
        progressCount,
      };
    });

    expect(result).toEqual({ allMatch: true, progressCount: 2000 });
  });
});

test.describe('keepAlive', () => {
  test('should keep the worker alive by default', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      const worker = createEasyWebWorker<null, number>(
        (easyWorker) => {
          let counter = 0;

          easyWorker.onMessage((message) => {
            counter += 1;

            message.resolve(counter);
          });
        },
        { terminationDelay: 20 }
      );

      const first = await worker.send();

      await wait(200);

      const second = await worker.send();
      const workers = worker.workers.length;

      await worker.dispose();

      return { first, second, workers };
    });

    expect(result).toEqual({ first: 1, second: 2, workers: 1 });
  });

  test('should terminate the worker after the termination delay', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      const worker = createEasyWebWorker<null, number>(
        (easyWorker) => {
          let counter = 0;

          easyWorker.onMessage((message) => {
            counter += 1;

            message.resolve(counter);
          });
        },
        { keepAlive: false, terminationDelay: 50 }
      );

      const first = await worker.send();
      const second = await worker.send();
      const workersBeforeDelay = worker.workers.length;

      await wait(300);

      const workersAfterDelay = worker.workers.length;

      // a new worker means a new state
      const third = await worker.send();

      await worker.dispose();

      return { first, second, third, workersBeforeDelay, workersAfterDelay };
    });

    expect(result).toEqual({
      first: 1,
      second: 2,
      third: 1,
      workersBeforeDelay: 1,
      workersAfterDelay: 0,
    });
  });

  test('should not terminate the worker while there are pending messages', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      const worker = createEasyWebWorker<number, string>(
        (easyWorker) => {
          easyWorker.onMessage((message) => {
            setTimeout(() => message.resolve('done'), message.payload);
          });
        },
        { keepAlive: false, terminationDelay: 20 }
      );

      const slow = worker.send(400);

      await worker.send(0);
      await wait(150);

      const workersWhilePending = worker.workers.length;
      const value = await slow;

      await wait(150);

      const workersAfterCompletion = worker.workers.length;

      await worker.dispose();

      return { value, workersWhilePending, workersAfterCompletion };
    });

    expect(result).toEqual({
      value: 'done',
      workersWhilePending: 1,
      workersAfterCompletion: 0,
    });
  });

  test('should not leak an unhandled rejection when a message fails', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle, wait } = window.e2e;

      let unhandledRejections = 0;

      window.addEventListener('unhandledrejection', () => {
        unhandledRejections += 1;
      });

      const worker = createEasyWebWorker(
        (easyWorker) => {
          easyWorker.onMessage<null, void>('reject', (message) => {
            message.reject('reason');
          });

          easyWorker.onMessage<null, void>('cancel', (message) => {
            message.cancel('reason');
          });
        },
        { keepAlive: false, terminationDelay: 20 }
      );

      const settled = [
        await settle(worker.sendToMethod('reject')),
        await settle(worker.sendToMethod('cancel')),
      ];

      await wait(200);

      return {
        settled: settled.map(({ status }) => status),
        unhandledRejections,
        workers: worker.workers.length,
      };
    });

    expect(result).toEqual({
      settled: ['rejected', 'rejected'],
      unhandledRejections: 0,
      workers: 0,
    });
  });

  test('should terminate the worker after a reboot', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle, wait } = window.e2e;

      const worker = createEasyWebWorker(
        (easyWorker) => {
          easyWorker.onMessage<null, void>('block', () => {});

          easyWorker.onMessage<null, string>('ping', (message) => {
            message.resolve('pong');
          });
        },
        { keepAlive: false, warmUpWorkers: true, terminationDelay: 20 }
      );

      const blocked = settle(worker.sendToMethod('block'));

      await worker.reboot('reboot');
      await blocked;

      const value = await worker.sendToMethod('ping');

      await wait(200);

      // the canceled message should not keep the worker alive
      return { value, workers: worker.workers.length };
    });

    expect(result).toEqual({ value: 'pong', workers: 0 });
  });
});

test.describe('reboot and dispose', () => {
  test('should not create the workers until needed when warmUpWorkers is false', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, string>(
        (easyWorker) => {
          easyWorker.onMessage((message) => message.resolve('done'));
        },
        { warmUpWorkers: false, keepAlive: true }
      );

      const workersBefore = worker.workers.length;
      const value = await worker.send();
      const workersAfter = worker.workers.length;

      await worker.dispose();

      return { workersBefore, value, workersAfter };
    });

    expect(result).toEqual({ workersBefore: 0, value: 'done', workersAfter: 1 });
  });

  test('reboot should cancel the messages and start a new worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        let counter = 0;

        easyWorker.onMessage<null, void>('block', () => {});

        easyWorker.onMessage<null, number>('increment', (message) => {
          counter += 1;

          message.resolve(counter);
        });
      });

      await worker.sendToMethod('increment');
      await worker.sendToMethod('increment');

      const previousWorker = worker.workers[0];

      const blocked = [
        settle(worker.sendToMethod('block')),
        settle(worker.sendToMethod('block')),
      ];

      await worker.reboot('rebooted');

      const settled = await Promise.all(blocked);
      const counter = await worker.sendToMethod('increment');

      const result = {
        settled,
        counter,
        workers: worker.workers.length,
        isNewWorker: worker.workers[0] !== previousWorker,
      };

      await worker.dispose();

      return result;
    });

    expect(result).toEqual({
      settled: new Array(2).fill({ status: 'rejected', reason: 'rebooted' }),
      counter: 1,
      workers: 1,
      isNewWorker: true,
    });
  });

  test('dispose should cancel the messages, terminate the worker and revoke the url', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle } = window.e2e;

      const canFetch = (url: string) =>
        fetch(url).then(
          (response) => response.ok,
          () => false
        );

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage((message) => {
          const timeoutId = setTimeout(() => message.resolve(), 5000);

          message.onCancel(() => clearTimeout(timeoutId));
        });
      });

      const workerUrl = String(worker.workerUrl);
      const isBlobUrl = workerUrl.startsWith('blob:');
      const availableBefore = await canFetch(workerUrl);

      const pending = [settle(worker.send()), settle(worker.send())];

      await worker.dispose();

      const settled = await Promise.all(pending);
      const availableAfter = await canFetch(workerUrl);

      return {
        isBlobUrl,
        availableBefore,
        availableAfter,
        workers: worker.workers.length,
        settled: settled.map(({ status }) => status),
      };
    });

    expect(result).toEqual({
      isBlobUrl: true,
      availableBefore: true,
      availableAfter: false,
      workers: 0,
      settled: ['rejected', 'rejected'],
    });
  });
});

test.describe('scripts', () => {
  test('should import a script into the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { scriptUrl } = window.e2e;

      const worker = createEasyWebWorker<null, number>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            const add = context.add as (a: number, b: number) => number;

            message.resolve(add(2, 3));
          });
        },
        { scripts: [scriptUrl('add')] }
      );

      const value = await worker.send();

      await worker.dispose();

      return value;
    });

    expect(result).toEqual(5);
  });

  test('should import multiple scripts into the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { scriptUrl, settleWithin } = window.e2e;

      let workerErrors = 0;

      const worker = createEasyWebWorker<null, number>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            const add = context.add as (a: number, b: number) => number;
            const multiply = context.multiply as typeof add;

            message.resolve(multiply(add(2, 3), 4));
          });
        },
        {
          scripts: [scriptUrl('add'), scriptUrl('multiply')],
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      const settled = await settleWithin(worker.send(), 2000);

      return { settled, workerErrors };
    });

    expect(result).toEqual({
      settled: { status: 'resolved', value: 20 },
      workerErrors: 0,
    });
  });
});

test.describe('worker errors', () => {
  test('should report the errors of the worker to onWorkerError', async ({
    page,
  }) => {
    expectPageErrors();

    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      const errors: { isErrorEvent: boolean; message: string }[] = [];

      const worker = createEasyWebWorker(
        (easyWorker) => {
          easyWorker.onMessage<null, void>('throw', () => {
            throw new Error('callback error');
          });

          easyWorker.onMessage<null, string>('ping', (message) => {
            message.resolve('pong');
          });
        },
        {
          onWorkerError: (error) => {
            errors.push({
              isErrorEvent: error instanceof ErrorEvent,
              message: typeof error.message,
            });
          },
        }
      );

      const settled = await settleWithin(worker.sendToMethod('throw'), 300);

      // the worker is still healthy
      const value = await worker.sendToMethod('ping');

      return { errors, value, status: settled.status };
    });

    expect(result.errors).toEqual([{ isErrorEvent: true, message: 'string' }]);
    expect(result.value).toEqual('pong');
  });

  test('should report an error when the method does not exist', async ({
    page,
  }) => {
    expectPageErrors();

    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      let workerErrors = 0;

      const worker = createEasyWebWorker(
        (easyWorker) => {
          easyWorker.onMessage<null, string>('ping', (message) => {
            message.resolve('pong');
          });
        },
        {
          onWorkerError: () => {
            workerErrors += 1;
          },
        }
      );

      await settleWithin(worker.sendToMethod('unknown'), 300);
      await settleWithin(worker.send(), 300);

      const value = await worker.sendToMethod('ping');

      return { workerErrors, value };
    });

    // one for the unknown method and one for the missing default callback
    expect(result).toEqual({ workerErrors: 2, value: 'pong' });
  });

  test('should throw the error in the page when there is no onWorkerError', async ({
    page,
  }) => {
    expectPageErrors();

    await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage(() => {
          throw new Error('callback error');
        });
      });

      await settleWithin(worker.send(), 300);
    });
  });
});
