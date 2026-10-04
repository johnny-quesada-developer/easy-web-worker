import { test, expect, expectPageErrors } from './fixtures';

test.describe('messages', () => {
  test('should resolve the result of each message', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, number>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve(message.payload * 2);
        });
      });

      const results = [
        await worker.send(1),
        await worker.send(2),
        await worker.send(21),
      ];

      await worker.dispose();

      return results;
    });

    expect(results).toEqual([2, 4, 42]);
  });

  test('should resolve undefined when the worker sends no result', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve();
        });
      });

      const result = await worker.send();

      await worker.dispose();

      return { type: typeof result };
    });

    expect(result).toEqual({ type: 'undefined' });
  });

  test('should run the worker outside of the main thread', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, number>((easyWorker) => {
        easyWorker.onMessage((message) => {
          const start = Date.now();

          // blocks the thread of the worker
          while (Date.now() - start < message.payload) {}

          message.resolve(Date.now() - start);
        });
      });

      let ticks = 0;

      const intervalId = setInterval(() => {
        ticks += 1;
      }, 10);

      const blockedTime = await worker.send(400);

      clearInterval(intervalId);

      await worker.dispose();

      return { ticks, blockedTime };
    });

    expect(result.blockedTime).toBeGreaterThanOrEqual(400);

    // the main thread kept running while the worker was blocked
    expect(result.ticks).toBeGreaterThan(10);
  });

  test('should keep each result with its own message when they run concurrently', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, number>((easyWorker) => {
        easyWorker.onMessage((message) => {
          // the later the message, the sooner it resolves
          setTimeout(() => {
            message.resolve(message.payload * 2);
          }, 20 - (message.payload % 20));
        });
      });

      const payloads = new Array(200).fill(null).map((_, index) => index);

      const results = await Promise.all(
        payloads.map((payload) => worker.send(payload))
      );

      await worker.dispose();

      return results.every((value, index) => value === index * 2);
    });

    expect(result).toEqual(true);
  });

  test('should reject with the reason of the worker', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settle, describeError } = window.e2e;

      const worker = createEasyWebWorker((easyWorker) => {
        easyWorker.onMessage('text', (message) => {
          message.reject('reason');
        });

        easyWorker.onMessage('object', (message) => {
          message.reject({ code: 500, details: ['a', 'b'] });
        });

        easyWorker.onMessage('error', (message) => {
          message.reject(new RangeError('out of range'));
        });
      });

      const results = [];

      for (const method of ['text', 'object', 'error']) {
        const settled = await settle(worker.sendToMethod(method));

        results.push(
          settled.status === 'rejected'
            ? describeError(settled.reason)
            : settled.status
        );
      }

      await worker.dispose();

      return results;
    });

    expect(result).toEqual([
      { isError: false, value: 'reason' },
      { isError: false, value: { code: 500, details: ['a', 'b'] } },
      { isError: true, name: 'RangeError', message: 'out of range' },
    ]);
  });

  test('should report the progress in order before resolving', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          for (let step = 1; step <= message.payload; step++) {
            message.reportProgress((step * 100) / message.payload, {
              step,
            });
          }

          message.resolve('done');
        });
      });

      const events: unknown[] = [];

      const value = await worker
        .send(4)
        .onProgress((percentage, payload) => {
          events.push([percentage, payload]);
        })
        .then((value) => {
          events.push('resolved');

          return value;
        });

      await worker.dispose();

      return { value, events };
    });

    expect(result).toEqual({
      value: 'done',
      events: [
        [25, { step: 1 }],
        [50, { step: 2 }],
        [75, { step: 3 }],
        [100, { step: 4 }],
        'resolved',
      ],
    });
  });

  test('should route each message to its method', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve(`default:${message.payload}`);
        });

        easyWorker.onMessage<number, number>('add', (message) => {
          message.resolve(message.payload + 1);
        });

        easyWorker.onMessage<string, string>('upper', (message) => {
          message.resolve(message.payload.toUpperCase());
        });
      });

      const results = [
        await worker.send(1),
        await worker.sendToMethod<number, number>('add', 1),
        await worker.sendToMethod<string, string>('upper', 'text'),
      ];

      await worker.dispose();

      return results;
    });

    expect(result).toEqual(['default:1', 2, 'TEXT']);
  });

  test('should share the worker scope between multiple bodies', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<number, number>([
        (_easyWorker, context) => {
          context.double = (value: number) => value * 2;
        },
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            const double = context.double as (value: number) => number;

            message.resolve(double(message.payload));
          });
        },
      ]);

      const result = await worker.send(21);

      await worker.dispose();

      return result;
    });

    expect(result).toEqual(42);
  });

  test('should expose the primitive parameters inside the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, unknown[]>(
        (easyWorker, context) => {
          easyWorker.onMessage((message) => {
            message.resolve(context.primitiveParameters);
          });
        },
        {
          primitiveParameters: [1, 'text', true, null, { nested: [1, 2] }],
        }
      );

      const result = await worker.send();

      await worker.dispose();

      return result;
    });

    expect(result).toEqual([1, 'text', true, null, { nested: [1, 2] }]);
  });

  test('should keep the state of the worker between messages', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, number>((easyWorker) => {
        let counter = 0;

        easyWorker.onMessage((message) => {
          counter += 1;

          message.resolve(counter);
        });
      });

      const results = [
        await worker.send(),
        await worker.send(),
        await worker.send(),
      ];

      await worker.dispose();

      return results;
    });

    expect(result).toEqual([1, 2, 3]);
  });

  test('should only deliver the first completion of a message', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { wait } = window.e2e;

      const worker = createEasyWebWorker<null, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve('first');
          message.resolve('second');
          message.reject('third');
          message.reportProgress(50);
        });
      });

      const progress: number[] = [];

      const first = await worker.send().onProgress((percentage) => {
        progress.push(percentage);
      });

      await wait(50);

      // the worker is still healthy
      const second = await worker.send();

      await worker.dispose();

      return { first, second, progress };
    });

    expect(result).toEqual({ first: 'first', second: 'first', progress: [] });
  });
});

test.describe('structured clone and transferable objects', () => {
  test('should clone complex payloads in both directions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      type Payload = {
        map: Map<string, number>;
        set: Set<number>;
        date: Date;
        bytes: Uint8Array;
        regexp: RegExp;
        nested: { list: unknown[] };
      };

      const worker = createEasyWebWorker<
        Payload,
        { received: Record<string, boolean>; echo: Payload }
      >((easyWorker) => {
        easyWorker.onMessage((message) => {
          const { payload } = message;

          message.resolve({
            received: {
              map: payload.map instanceof Map && payload.map.get('a') === 1,
              set: payload.set instanceof Set && payload.set.has(2),
              date: payload.date instanceof Date,
              bytes: payload.bytes instanceof Uint8Array,
              regexp: payload.regexp instanceof RegExp,
            },
            echo: payload,
          });
        });
      });

      const date = new Date('2020-01-02T03:04:05.000Z');

      const { received, echo } = await worker.send({
        map: new Map([['a', 1]]),
        set: new Set([1, 2]),
        date,
        bytes: new Uint8Array([1, 2, 3]),
        regexp: /worker/gi,
        nested: { list: [1, 'two', null, { three: 3 }] },
      });

      await worker.dispose();

      return {
        received,
        echo: {
          map: echo.map instanceof Map && echo.map.get('a') === 1,
          set: echo.set instanceof Set && echo.set.size === 2,
          date: echo.date instanceof Date && echo.date.getTime() === date.getTime(),
          bytes: Array.from(echo.bytes),
          regexp: `${echo.regexp.source}/${echo.regexp.flags}`,
          nested: echo.nested,
        },
      };
    });

    expect(result).toEqual({
      received: { map: true, set: true, date: true, bytes: true, regexp: true },
      echo: {
        map: true,
        set: true,
        date: true,
        bytes: [1, 2, 3],
        regexp: 'worker/gi',
        nested: { list: [1, 'two', null, { three: 3 }] },
      },
    });
  });

  test('should transfer the ownership of a buffer to the worker', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<ArrayBuffer, number>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve(message.payload.byteLength);
        });
      });

      const transferred = new ArrayBuffer(1024);
      const cloned = new ArrayBuffer(1024);

      const receivedFromTransfer = await worker.send(transferred, [transferred]);
      const receivedFromClone = await worker.send(cloned);

      await worker.dispose();

      return {
        receivedFromTransfer,
        receivedFromClone,
        transferredLength: transferred.byteLength,
        clonedLength: cloned.byteLength,
      };
    });

    expect(result).toEqual({
      receivedFromTransfer: 1024,
      receivedFromClone: 1024,

      // a transferred buffer is detached in the sender
      transferredLength: 0,
      clonedLength: 1024,
    });
  });

  test('should transfer the ownership of a buffer to the main thread', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;

      const worker = createEasyWebWorker<null, ArrayBuffer>((easyWorker) => {
        const buffers: Record<string, ArrayBuffer> = {};

        const send =
          (action: 'resolve' | 'reject' | 'cancel' | 'reportProgress') =>
          (message) => {
            const buffer = new ArrayBuffer(2048);

            buffers[action] = buffer;

            if (action === 'reportProgress') {
              message.reportProgress(50, buffer, [buffer]);
              message.resolve();

              return;
            }

            message[action](buffer, [buffer]);
          };

        easyWorker.onMessage('resolve', send('resolve'));
        easyWorker.onMessage('reject', send('reject'));
        easyWorker.onMessage('cancel', send('cancel'));
        easyWorker.onMessage('reportProgress', send('reportProgress'));

        easyWorker.onMessage<null, Record<string, number>>(
          'getLengths',
          (message) => {
            message.resolve(
              Object.fromEntries(
                Object.entries(buffers).map(([action, buffer]) => [
                  action,
                  buffer.byteLength,
                ])
              )
            );
          }
        );
      });

      const received: Record<string, number> = {};

      received.resolve = (
        await worker.sendToMethod<ArrayBuffer>('resolve')
      ).byteLength;

      for (const action of ['reject', 'cancel']) {
        await worker.sendToMethod(action).catch((buffer: ArrayBuffer) => {
          received[action] = buffer.byteLength;
        });
      }

      await worker
        .sendToMethod('reportProgress')
        .onProgress((_percentage, buffer) => {
          received.reportProgress = (buffer as ArrayBuffer).byteLength;
        });

      const lengthsInWorker = await worker.sendToMethod<Record<string, number>>(
        'getLengths'
      );

      await worker.dispose();

      return { received, lengthsInWorker };
    });

    expect(result).toEqual({
      received: { resolve: 2048, reject: 2048, cancel: 2048, reportProgress: 2048 },
      lengthsInWorker: { resolve: 0, reject: 0, cancel: 0, reportProgress: 0 },
    });
  });

  test('should throw when the payload can not be cloned', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { describeError } = window.e2e;

      const worker = createEasyWebWorker<unknown, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve('done');
        });
      });

      let error: unknown = null;

      try {
        worker.send(() => {});
      } catch (sendError) {
        error = describeError(sendError);
      }

      // the worker is still healthy
      const value = await worker.send('payload');

      return { error, value };
    });

    expect(result).toEqual({
      error: {
        isError: true,
        name: 'DataCloneError',
        message: expect.any(String),
      },
      value: 'done',
    });
  });

  test('should not keep in the queue a message that could not be sent', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      const worker = createEasyWebWorker<unknown, string>((easyWorker) => {
        easyWorker.onMessage((message) => {
          message.resolve('done');
        });
      });

      try {
        worker.send(() => {});
      } catch (error) {}

      // there is nothing to cancel, the worker never received the message
      const { status } = await settleWithin(worker.cancelAll(), 1000);

      return status;
    });

    expect(result).toEqual('resolved');
  });

  test('should report a worker error when the result can not be cloned', async ({
    page,
  }) => {
    expectPageErrors();

    const result = await page.evaluate(async () => {
      const { createEasyWebWorker } = window.easyWebWorker;
      const { settleWithin } = window.e2e;

      let errors = 0;

      const worker = createEasyWebWorker<null, unknown>(
        (easyWorker) => {
          easyWorker.onMessage<null, unknown>('invalid', (message) => {
            message.resolve(() => {});
          });

          easyWorker.onMessage<null, string>('valid', (message) => {
            message.resolve('done');
          });
        },
        {
          onWorkerError: () => {
            errors += 1;
          },
        }
      );

      await settleWithin(worker.sendToMethod('invalid'), 300);

      // the worker is still healthy
      const valid = await worker.sendToMethod('valid');

      return { valid, errors };
    });

    expect(result).toEqual({ valid: 'done', errors: 1 });
  });
});
