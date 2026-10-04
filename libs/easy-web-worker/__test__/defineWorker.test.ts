import path from 'path';
import url from 'url';
import { createDecoupledPromise } from 'easy-cancelable-promise/createDecoupledPromise';
import { EasyWebWorker } from 'easy-web-worker';
import { unwrap, createWorker } from 'easy-web-worker/createWorker';
import type { TestWorker, TransferPayload } from './defineWorker.worker';

/**
 * Same suite as StaticEasyWebWorker.test.ts, using a worker created with defineWorker and called through createWorker.
 */
describe('defineWorker + createWorker', () => {
  const createTestWorker = () =>
    createWorker<TestWorker>(
      url.pathToFileURL(path.resolve(__dirname, './defineWorker.worker.ts')),
      {
        workerOptions: {
          name: 'defineWorker',
        },
      }
    );

  let worker: ReturnType<typeof createTestWorker>;

  beforeEach(() => {
    worker = createTestWorker();
  });

  afterEach(async () => {
    await unwrap(worker).dispose();
  });

  describe('constructor', () => {
    it('should create the worker behind the proxy', () => {
      const instance = unwrap(worker);

      expect(instance).toBeInstanceOf(EasyWebWorker);
      expect(instance.config.workerOptions?.name).toEqual('defineWorker');
      expect(instance.workers.length).toBe(1);
      expect(instance.workers[0]).toBeInstanceOf(Worker);
      expect(instance.config.keepAlive).toEqual(true);
      expect(instance.config.warmUpWorkers).toEqual(true);
    });

    it('should not expose the worker instance as a method', () => {
      expect(Object.keys(worker)).toEqual([]);
      expect((worker as unknown as PromiseLike<unknown>).then).toBeUndefined();
    });
  });

  describe('methods', () => {
    it('should resolve the value returned by the method', async () => {
      expect(await worker.hello()).toBe('Hello from defineWorker!');
    });

    it('should send the payload to the method', async () => {
      expect(await worker.actionWithPayload('Worker')).toBe('Hello Worker!');
    });

    it('should resolve the value of an async method', async () => {
      expect(await worker.sum([1, 2, 3, 4])).toBe(10);
    });

    it('should reject with the error thrown by the method', async () => {
      const error = await worker.fail('method error').catch((error) => error);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toEqual('method error');
    });

    it('should reject with the error of an async method', async () => {
      const error = await worker
        .failAsync('async method error')
        .catch((error) => error);

      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toEqual('async method error');
    });

    it('should correctly report progress on children promises', async () => {
      expect.assertions(2);

      const progressLogger = vi.fn();

      const numericResult = await worker
        .progressTest()
        .onProgress(() => progressLogger())
        .then((result) => result)
        .onProgress(() => progressLogger())
        .then((result) => result)
        .onProgress(() => progressLogger());

      expect(progressLogger).toHaveBeenCalledTimes(300);
      expect(numericResult).toBe(4950);
    });

    it('should be able to updated a variable inside the worker', async () => {
      expect.assertions(2);

      expect(await worker.getCount()).toBe(0);

      await worker.setCount(2);

      expect(await worker.getCount()).toBe(2);
    });

    it('should be able to cancel a specific method execution', async () => {
      expect.assertions(6);

      expect(await worker.getAsyncOperationState()).toEqual({
        asyncOperationWasCalled: false,
        didAsyncOperationFinish: false,
        didAsyncOperationCancel: false,
      });

      const asyncOperation = worker.asyncOperation();

      const firstProgressResult = await new Promise((resolve) => {
        asyncOperation.onProgress((progress) => {
          resolve(progress);
        });
      });

      expect(firstProgressResult).not.toBeNaN();
      expect(firstProgressResult).toBeDefined();

      expect(await worker.getAsyncOperationState()).toEqual({
        asyncOperationWasCalled: true,
        didAsyncOperationFinish: false,
        didAsyncOperationCancel: false,
      });

      // Cancel the operation and check for errors
      const errorLogger = vi.fn();
      await asyncOperation.cancel('cancel').catch(errorLogger);
      expect(errorLogger).toHaveBeenCalledTimes(1);

      expect(await worker.getAsyncOperationState()).toEqual({
        asyncOperationWasCalled: true,
        didAsyncOperationFinish: false,
        didAsyncOperationCancel: true,
      });
    });
  });

  describe('unwrap', () => {
    it('should send messages without a method', async () => {
      const callback = vi.fn();

      await unwrap(worker).send(null).then(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should send messages to a method by its name', async () => {
      expect(
        await unwrap(worker).sendToMethod<string, string>(
          'actionWithPayload',
          'Worker'
        )
      ).toBe('Hello Worker!');
    });

    describe('override', () => {
      it('Worker should correctly invalid previous messages', () => {
        expect.assertions(4);

        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const callback3 = vi.fn();
        const errorLogger = vi.fn();

        worker.asyncOperation().then(callback1).catch(errorLogger);
        worker.asyncOperation().then(callback2).catch(errorLogger);

        return unwrap(worker)
          .override(null)
          .then(callback3)
          .then(() => {
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(callback3).toHaveBeenCalled();
            expect(errorLogger).toHaveBeenCalledTimes(2);
          });
      });
    });

    describe('overrideAfterCurrent', () => {
      it('Worker should correctly invalid previous messages after current execution', async () => {
        expect.assertions(5);

        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const callback3 = vi.fn();
        const errorLogger = vi.fn();
        const onProgressLogger = vi.fn();

        worker.hello().then(callback1);

        worker.asyncOperation().then(callback2).catch(errorLogger);
        worker.asyncOperation().catch(errorLogger);
        worker.asyncOperation().catch(errorLogger);

        await unwrap(worker)
          .overrideAfterCurrent(null)
          .onProgress(onProgressLogger)
          .then(callback3);

        expect(callback1).toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalled();
        expect(errorLogger).toHaveBeenCalledTimes(3);
        expect(onProgressLogger).toHaveBeenCalledTimes(3);
      });

      it('Worker stop reporting progress after cancel', async () => {
        const progressLogger = vi.fn();
        const errorLogger = vi.fn();

        const onProgressSpy = createDecoupledPromise();

        worker
          .fastAsyncOperation()
          .onProgress((progress) => {
            onProgressSpy.resolve(progress);
            progressLogger();
          })
          .catch(errorLogger);

        await onProgressSpy.promise;

        expect(progressLogger).toHaveBeenCalledTimes(1);

        progressLogger.mockClear();

        await unwrap(worker).cancelAll('cancel');

        await new Promise((resolve) => setTimeout(resolve, 500));

        expect(progressLogger).toHaveBeenCalledTimes(0);
        expect(errorLogger).toHaveBeenCalledTimes(1);
      });
    });

    describe('dispose', () => {
      it('should correctly dispose worker (remove worker and revokeObjectURL)', async () => {
        expect.assertions(4);

        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const errorLogger = vi.fn();

        worker.asyncOperation().then(callback1).catch(errorLogger);
        worker.asyncOperation().then(callback2).catch(errorLogger);

        await unwrap(worker).dispose();

        expect(unwrap(worker).workers.length).toEqual(0);
        expect(errorLogger).toHaveBeenCalledTimes(2);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancel', () => {
    it('should correctly cancel worker', async () => {
      expect.assertions(2);

      const callback1 = vi.fn();
      const errorLogger = vi.fn();

      await worker
        .asyncOperation()
        .then(callback1)
        .cancel('cancel')
        .catch(errorLogger);

      expect(callback1).not.toHaveBeenCalled();
      expect(errorLogger).toHaveBeenCalledWith('cancel');
    });

    it('should cancel the message from inside the worker', async () => {
      expect.assertions(2);

      const callback1 = vi.fn();
      const errorLogger = vi.fn();

      await worker.cancelTest().then(callback1).catch(errorLogger);

      expect(callback1).not.toHaveBeenCalled();
      expect(errorLogger).toHaveBeenCalledWith(
        'canceled from inside the worker'
      );
    });
  });

  describe('subscriptions', () => {
    (['onResolve', 'onCancel', 'onProgress', 'onFinalize'] as const).forEach(
      (callbackKey) => {
        it(`should correctly subscribe to ${callbackKey}`, async () => {
          expect.assertions(5);

          const callback1 = vi.fn();
          const errorLogger = vi.fn();

          worker.sendOpenMessage(callbackKey).then(callback1).catch(errorLogger);

          await new Promise((resolve) => setTimeout(resolve, 10));

          expect(callback1).not.toHaveBeenCalled();
          expect(await worker.getDidCallbackWasCalled()).toEqual(false);

          await worker.sendCloseMessage().then(callback1);

          expect(callback1).toBeCalledTimes(callbackKey === 'onCancel' ? 1 : 2);
          expect(await worker.getDidCallbackWasCalled()).toEqual(true);
          expect(errorLogger).toHaveBeenCalledTimes(
            callbackKey === 'onCancel' ? 1 : 0
          );
        });
      }
    );
  });

  describe('transferable objects', () => {
    (['reportProgress', 'resolve', 'reject', 'cancel'] as const).forEach(
      (action) => {
        it(`should transfer a big array buffer when ${action}`, async () => {
          expect.assertions(4);

          const errorLogger = vi.fn();
          const progressLogger = vi.fn();
          const bigArrayBuffer = new ArrayBuffer(1000000);

          let progressMetadata: TransferPayload = null;

          const result = (await worker
            .transferArrayBuffer({ arrayBuffer: bigArrayBuffer, action }, [
              bigArrayBuffer,
            ])
            .onProgress((progress, metadata) => {
              progressLogger(progress);

              progressMetadata = metadata as TransferPayload;
            })
            .catch((reason) => {
              errorLogger();

              return reason;
            })) as unknown as TransferPayload;

          if (action === 'resolve') {
            expect(errorLogger).not.toHaveBeenCalled();
            expect(progressLogger).not.toHaveBeenCalled();
          }

          if (action === 'reject' || action === 'cancel') {
            expect(errorLogger).toHaveBeenCalledTimes(1);
            expect(progressLogger).not.toHaveBeenCalled();
          }

          if (action === 'reportProgress') {
            expect(progressLogger).toHaveBeenCalledWith(50);
            expect(errorLogger).not.toHaveBeenCalled();

            expect(bigArrayBuffer.byteLength).toEqual(0);
            expect(progressMetadata.arrayBuffer.byteLength).toEqual(1000000);

            return;
          }

          expect(result.arrayBuffer.byteLength).toEqual(1000000);
          expect(bigArrayBuffer.byteLength).toEqual(0);
        });
      }
    );
  });
});
