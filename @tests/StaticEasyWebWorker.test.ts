import path from 'path';
import url from 'url';
import EasyWebWorker from '../src';
import { createDecoupledPromise } from 'cancelable-promise-jq';

describe('StaticEasyWebWorker', () => {
  let worker: EasyWebWorker<null, string>;

  beforeEach(() => {
    worker = new EasyWebWorker<null, string>(
      url.pathToFileURL(
        path.resolve(__dirname, '../@tests/StaticEasyWebWorker.worker.js')
      ),
      {
        workerOptions: {
          name: 'StaticEasyWebWorker',
        },
      }
    );
  });

  afterEach(async () => {
    await worker.dispose();
  });

  describe('constructor', () => {
    it('properties should be correctly populated', () => {
      expect(worker.config.workerOptions?.name).toEqual('StaticEasyWebWorker');
      expect(worker.workers.length).toBe(1);
      expect((worker as any).workers[0]).toBeInstanceOf(Worker);
    });

    it('worker should initialize correctly', () => {
      expect(worker.workerUrl).toBeDefined();
      expect(worker.config.keepAlive).toEqual(true);
      expect(worker.config.warmUpWorkers).toEqual(true);
      expect(worker.workers.length).toEqual(1);
      expect(worker.workers[0]).toBeInstanceOf(Worker);
    });
  });

  describe('Methods', () => {
    beforeEach(() => {});

    describe('send', () => {
      it('worker should run correctly messages', async () => {
        expect.assertions(1);

        const message = await worker.send();

        expect(message).toBe('Hello from StaticEasyWebWorker!');
      });

      it('should correctly report progress on children promises', async () => {
        expect.assertions(2);

        const progressLogger = jest.fn();

        const numericResult = await worker
          .sendToMethod<number>('progressTest')
          .onProgress(() => progressLogger())
          .then((result) => result)
          .onProgress(() => progressLogger())
          .then((result) => result)
          .onProgress(() => progressLogger());

        expect(progressLogger).toHaveBeenCalledTimes(300);
        expect(numericResult).toBe(4950);
      });
    });

    describe('sendToMethod', () => {
      it('worker should run correctly specific method', async () => {
        expect.assertions(1);

        const message = await worker.sendToMethod<string, string>(
          'actionWithPayload',
          'Worker'
        );

        expect(message).toBe('Hello Worker!');
      });

      it('worker should be able to updated a variable inside the worker', async () => {
        expect.assertions(2);

        let count = await worker.sendToMethod<Number>('getCount');

        expect(count).toBe(0);

        await worker.sendToMethod<null, Number>('setCount', 2);

        count = await worker.sendToMethod<Number>('getCount');

        expect(count).toBe(2);
      });

      it('should be able to cancel a specific method execution', async () => {
        type IAsyncOperationState = {
          asyncOperationWasCalled: boolean;
          didAsyncOperationFinish: boolean;
          didAsyncOperationCancel: boolean;
        };

        expect.assertions(6);

        let operationState = await worker.sendToMethod<IAsyncOperationState>(
          'getAsyncOperationState'
        );

        expect(operationState).toEqual({
          asyncOperationWasCalled: false,
          didAsyncOperationFinish: false,
          didAsyncOperationCancel: false,
        });

        const asyncOperation = worker.sendToMethod('asyncOperation');

        const firstProgressResult = await new Promise((resolve) => {
          asyncOperation.onProgress((progress) => {
            resolve(progress);
          });
        });

        expect(firstProgressResult).not.toBeNaN();
        expect(firstProgressResult).toBeDefined();

        operationState = await worker.sendToMethod<IAsyncOperationState>(
          'getAsyncOperationState'
        );

        expect(operationState).toEqual({
          asyncOperationWasCalled: true,
          didAsyncOperationFinish: false,
          didAsyncOperationCancel: false,
        });

        // Cancel the operation and check for errors
        const errorLogger = jest.fn();
        await asyncOperation.cancel('cancel').catch(errorLogger);
        expect(errorLogger).toHaveBeenCalledTimes(1);

        operationState = await worker.sendToMethod<IAsyncOperationState>(
          'getAsyncOperationState'
        );

        expect(operationState).toEqual({
          asyncOperationWasCalled: true,
          didAsyncOperationFinish: false,
          didAsyncOperationCancel: true,
        });
      });

      describe('override', () => {
        it('Worker should correctly invalid previous messages', () => {
          expect.assertions(4);

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const callback3 = jest.fn();
          const errorLogger = jest.fn();

          worker
            .sendToMethod('asyncOperation')
            .then(callback1)
            .catch(errorLogger);

          worker
            .sendToMethod('asyncOperation')
            .then(callback2)
            .catch(errorLogger);

          return worker
            .override()
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

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const callback3 = jest.fn();
          const errorLogger = jest.fn();
          const onProgressLogger = jest.fn();

          worker.send().then(callback1);

          worker
            .sendToMethod('asyncOperation')
            .then(callback2)
            .catch(errorLogger);

          worker.sendToMethod('asyncOperation').catch(errorLogger);

          worker.sendToMethod('asyncOperation').catch(errorLogger);

          await worker
            .overrideAfterCurrent()
            .onProgress(onProgressLogger)
            .then(callback3);

          expect(callback1).toHaveBeenCalled();
          expect(callback2).not.toHaveBeenCalled();
          expect(callback3).toHaveBeenCalled();
          expect(errorLogger).toHaveBeenCalledTimes(3);
          expect(onProgressLogger).toHaveBeenCalledTimes(3);
        });

        it('Worker stop reporting progress after cancel', async () => {
          // expect.assertions(2);

          const progressLogger = jest.fn();
          const errorLogger = jest.fn();

          let onProgressSpy = createDecoupledPromise();

          worker
            .sendToMethod('fastAsyncOperation')
            .onProgress((progress) => {
              onProgressSpy.resolve(progress);
              progressLogger();
            })
            .catch(errorLogger);

          await onProgressSpy.promise;

          expect(progressLogger).toHaveBeenCalledTimes(1);

          progressLogger.mockClear();

          await worker.cancelAll('cancel').cancel('cancel_cancelation');

          await new Promise((resolve) => setTimeout(resolve, 1000));

          expect(progressLogger).toHaveBeenCalledTimes(0);
          expect(errorLogger).toHaveBeenCalledTimes(1);

          // await worker.cancelAll('cancel').catch(errorLogger).cancel('cancel');

          await new Promise((resolve) => setTimeout(resolve, 1000));

          // expect(progressLogger).toHaveBeenCalledTimes(1);
        });
      });

      describe('dispose', () => {
        it('should correctly dispose worker (remove worker and revokeObjectURL)', async () => {
          expect.assertions(4);

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const errorLogger = jest.fn();

          worker
            .sendToMethod('asyncOperation')
            .then(callback1)
            .catch(errorLogger);

          worker
            .sendToMethod('asyncOperation')
            .then(callback2)
            .catch(errorLogger);

          await worker.dispose();

          expect(worker.workers.length).toEqual(0);
          expect(errorLogger).toHaveBeenCalledTimes(2);
          expect(callback1).not.toHaveBeenCalled();
          expect(callback2).not.toHaveBeenCalled();
        });
      });

      describe('cancel', () => {
        it('should correctly cancel worker', async () => {
          expect.assertions(2);

          const callback1 = jest.fn();
          const errorLogger = jest.fn();

          await worker
            .sendToMethod('asyncOperation')
            .then(callback1)
            .cancel('cancel')
            .catch(errorLogger);

          expect(callback1).not.toHaveBeenCalled();
          expect(errorLogger).toHaveBeenCalledWith('cancel');
        });

        it('should cancel the message from inside the worker', async () => {
          expect.assertions(2);

          const callback1 = jest.fn();
          const errorLogger = jest.fn();

          await worker
            .sendToMethod('cancelTest')
            .then(callback1)
            .catch(errorLogger);

          expect(callback1).not.toHaveBeenCalled();
          expect(errorLogger).toHaveBeenCalledWith(
            'canceled from inside the worker'
          );
        });
      });

      describe('subscriptions', () => {
        ['onResolve', 'onCancel', 'onProgress', 'onFinalize'].forEach(
          (callbackKey) => {
            it(`should correctly subscribe to ${callbackKey}`, async () => {
              expect.assertions(5);

              const callback1 = jest.fn();
              const errorLogger = jest.fn();

              worker
                .sendToMethod('sendOpenMessage', callbackKey)
                .then(callback1)
                .catch(errorLogger);

              await new Promise((resolve) => setTimeout(resolve, 10));

              expect(callback1).not.toHaveBeenCalled();

              let didCallbackWasCalled = await worker.sendToMethod(
                'getDidCallbackWasCalled'
              );

              expect(didCallbackWasCalled).toEqual(false);

              await worker.sendToMethod('sendCloseMessage').then(callback1);

              didCallbackWasCalled = await worker.sendToMethod(
                'getDidCallbackWasCalled'
              );

              expect(callback1).toBeCalledTimes(
                callbackKey === 'onCancel' ? 1 : 2
              );
              expect(didCallbackWasCalled).toEqual(true);
              expect(errorLogger).toHaveBeenCalledTimes(
                callbackKey === 'onCancel' ? 1 : 0
              );
            });
          }
        );
      });

      describe('methods', () => {
        (
          ['reportProgress', 'resolve', 'reject', 'cancel'] as (
            | 'resolve'
            | 'reject'
            | 'cancel'
            | 'reportProgress'
          )[]
        ).forEach((action) => {
          it(`should transfer a big array buffer when ${action}`, async () => {
            expect.assertions(4);

            const errorLogger = jest.fn();
            const progressLogger = jest.fn();
            const bigArrayBuffer = new ArrayBuffer(1000000);

            type TPayload = {
              arrayBuffer: ArrayBuffer;
              action;
            };

            let progressMetadata: TPayload = null as unknown as TPayload;

            const result = await worker
              .sendToMethod<TPayload, TPayload>(
                'transferArrayBuffer',
                {
                  arrayBuffer: bigArrayBuffer,
                  action,
                },
                [bigArrayBuffer]
              )
              .onProgress((progress, metadata) => {
                progressLogger(progress);

                progressMetadata = metadata as TPayload;
              })
              .catch<TPayload>((reason) => {
                errorLogger();

                return reason;
              });

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
        });
      });
    });
  });
});
