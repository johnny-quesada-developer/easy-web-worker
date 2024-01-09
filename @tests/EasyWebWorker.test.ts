import {
  EasyWebWorker,
  EasyWebWorkerBody,
  IEasyWebWorkerMessage,
  IWorkerConfig,
  createEasyWebWorker,
} from '../src';

import * as testFixtures from './testFixtures';

const replaceAll = (target: string, search: string, replacement: string) => {
  return target.split(search).join(replacement);
};

const {
  getMockBlobContent,
  WorkerMock,
  dummyUrl,
  createMockFunctionFromContent,
} = testFixtures;

describe('EasyWebWorker', () => {
  let blobSpy: jest.SpyInstance;

  beforeEach(() => {
    blobSpy = jest.spyOn(testFixtures, 'MockBlob');
  });

  describe('constructor', () => {
    const scripts = ['fake.js'];
    const workerName = 'workerTest';

    const workerContent: EasyWebWorkerBody = (easyWorker, context) => {
      context.globalPropertyTest = 'globalPropertyTest';

      easyWorker.onMessage((message) => {
        message.resolve();
      });
    };

    it('properties should be correctly populated', () => {
      const worker = createEasyWebWorker(workerContent, {
        name: workerName,
        scripts,
      });

      expect(worker.name).toEqual(workerName);
      expect((worker as any).scripts).toEqual(scripts);
      expect((worker as any).worker).toBeInstanceOf(WorkerMock);
    });

    it('simple worker BLOB content should be generated correctly', () => {
      expect.assertions(3);

      blobSpy.mockImplementation(
        (content: string[], config: { type: string }) => {
          expect(config).toEqual({ type: 'application/javascript' });

          const sanitizedContent = replaceAll(
            replaceAll(content.join('').replace(/\s+/g, ''), '"', "'"),
            'debugger;',
            ''
          );

          const sanitizedMock = replaceAll(
            replaceAll(getMockBlobContent().replace(/\s+/g, ''), '"', "'"),
            'debugger;',
            ''
          );

          expect(sanitizedContent).toEqual(sanitizedMock);
        }
      );

      const worker = new EasyWebWorker(workerContent, {
        name: workerName,
        scripts,
      });

      expect(worker.workerUrl).toEqual(dummyUrl);
    });

    it('worker should initialize correctly', () => {
      let workerBody: string = '';

      blobSpy.mockImplementation((content: string[]) => {
        workerBody = `${content.join('')} return self.ew$;`;
      });

      const worker = new EasyWebWorker(workerContent, {
        name: workerName,
        scripts,
      });

      const importScripts = jest.fn();
      const onmessage = jest.fn();
      const postMessage = jest.fn();

      const workerContext = {
        globalPropertyTest: null,
        importScripts,
        onmessage,
        postMessage,
      };

      const easyWorkerInstance =
        createMockFunctionFromContent(workerBody)(workerContext);

      expect(importScripts).toHaveBeenCalledWith(scripts);
      expect(onmessage).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
      expect(workerContext.globalPropertyTest).toEqual('globalPropertyTest');

      expect(easyWorkerInstance).toBeDefined();
      expect(easyWorkerInstance.onMessage).toBeDefined();
    });

    it('worker should initialize correctly workerBody[] (multiple body sources)', () => {
      let workerBody: string = '';

      blobSpy.mockImplementation((content: string[]) => {
        workerBody = `${content.join('')} return self.ew$;`;
      });

      const secondWorkerContent: EasyWebWorkerBody = (easyWorker, context) => {
        context.testFunction = (increase: number) => increase + 1;
      };

      new EasyWebWorker([secondWorkerContent, workerContent], {
        name: workerName,
        scripts,
      });

      const workerContext = {
        importScripts: jest.fn(),
        testFunction: null as unknown as (value: number) => void,
      };

      createMockFunctionFromContent(workerBody)(workerContext);

      expect(workerContext.testFunction(2)).toEqual(3);
    });
  });

  describe('Methods', () => {
    let _worker: EasyWebWorker<any, any>;
    let workerBody: string;

    let workerSelf: {
      importScripts: any;
      onmessage: any;
      postMessage: any;
    };

    const createWorker = <IPayload = null, IResult = void>(
      workerContent:
        | EasyWebWorkerBody<IPayload, IResult>
        | EasyWebWorkerBody<IPayload, IResult>[],
      config: Partial<IWorkerConfig> = {}
    ): EasyWebWorker<IPayload, IResult> => {
      _worker = new EasyWebWorker(workerContent, config);

      return _worker;
    };

    beforeEach(() => {
      blobSpy.mockImplementation((content: string[]) => {
        workerBody = `${content.join('')} return self.ew$;`;
      });

      workerSelf = {
        importScripts: jest.fn(),
        onmessage: null,
        postMessage: (payload: unknown) => {
          setTimeout(() => {
            // @ts-ignore
            _worker.worker.onmessage({
              data: payload,
            });
          }, 1);
        },
      };

      WorkerMock.prototype.postMessage = function (data: any) {
        setTimeout(() => {
          workerSelf.onmessage({
            data,
          });
        }, 1);
      };
    });

    describe('send', () => {
      it('worker should run correctly messages', async () => {
        expect.assertions(3);

        const workerContent: EasyWebWorkerBody<number, number> = (
          easyWorker
        ) => {
          easyWorker.onMessage((message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        expect(await worker.send(2)).toEqual(4);
        expect(await worker.send(8)).toEqual(10);
        expect(await worker.send(-4)).toEqual(-2);
      });

      it('should correctly report progress on children promises', async () => {
        expect.assertions(1);

        const workerContent: EasyWebWorkerBody<number, number> = (
          easyWorker
        ) => {
          easyWorker.onMessage((message) => {
            message.reportProgress(1);

            message.resolve(1);
          });
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        const progressLogger = jest.fn();

        return worker
          .send(1)
          .onProgress(progressLogger)
          .then(() => {})
          .onProgress(progressLogger)
          .then(() => {})
          .onProgress(progressLogger)
          .then(() => {
            expect(progressLogger).toHaveBeenCalledTimes(3);
          });
      });

      it('worker should correctly report progress', async () => {
        expect.assertions(2);

        const onProgressSpy = jest.fn();
        const workerContent: EasyWebWorkerBody<null, number> = (easyWorker) => {
          const countTo100 = (message: IEasyWebWorkerMessage<null, number>) => {
            let progress = 0;
            const intervalId = setInterval(() => {
              progress += 1;

              message.reportProgress(progress);

              if (progress === 100) {
                clearInterval(intervalId);
                message.resolve(progress);
              }
            }, 1);
          };

          easyWorker.onMessage(countTo100);
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        expect(await worker.send().onProgress(onProgressSpy)).toEqual(100);
        expect(onProgressSpy).toHaveBeenCalledTimes(100);
      });

      it('worker content should run correctly messages workerBody[] (multiple body sources)', async () => {
        expect.assertions(2);

        const onProgressSpy = jest.fn(() => {});
        const workerContent1: EasyWebWorkerBody<null, number> = (
          _easyWorker,
          context
        ) => {
          context.countTo100 = (
            message: IEasyWebWorkerMessage<null, number>
          ) => {
            let progress = 0;
            const intervalId = setInterval(() => {
              progress += 1;
              message.reportProgress(progress);

              if (progress === 100) {
                clearInterval(intervalId);
                message.resolve(progress);
              }
            }, 1);
          };
        };

        const workerContent2: EasyWebWorkerBody<null, number> = (
          easyWorker,
          context
        ) => {
          easyWorker.onMessage(context.countTo100 as any);
        };

        const worker = createWorker<null, number>([
          workerContent1,
          workerContent2,
        ]);

        createMockFunctionFromContent(workerBody)(workerSelf);

        expect(await worker.send().onProgress(onProgressSpy)).toEqual(100);
        expect(onProgressSpy).toHaveBeenCalledTimes(100);
      });
    });

    describe('sendToMethod', () => {
      it('worker should run correctly specific method', async () => {
        expect.assertions(3);

        const workerContent: EasyWebWorkerBody<number, number> = (
          easyWorker
        ) => {
          easyWorker.onMessage<number, number>('doSomething', (message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        expect(await worker.sendToMethod('doSomething', 2)).toEqual(4);
        expect(await worker.sendToMethod('doSomething', 8)).toEqual(10);
        expect(await worker.sendToMethod('doSomething', -4)).toEqual(-2);
      });

      it('should be able to cancel a specific method execution', async () => {
        expect.assertions(2);

        const workerContent: EasyWebWorkerBody<number, number> = (
          easyWorker
        ) => {
          easyWorker.onMessage<number, number>('doSomething', (message) => {
            message.onCancel(() => {
              expect(true).toEqual(true);
            });

            setTimeout(() => {
              const { payload } = message;

              message.resolve(payload + 2);
            }, 1000);
          });
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        const errorLogger = jest.fn();

        await worker.sendToMethod('doSomething', 2).cancel().catch(errorLogger);

        expect(errorLogger).toHaveBeenCalledTimes(1);
      });

      it('should correctly subscribe multiple methods', async () => {
        expect.assertions(2);

        const workerContent: EasyWebWorkerBody<number, number> = (
          easyWorker
        ) => {
          easyWorker.onMessage<number, number>('doSomething', (message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });

          easyWorker.onMessage<number, number>('doSomethingElse', (message) => {
            const { payload } = message;

            message.resolve(payload + 3);
          });
        };

        const worker = createWorker(workerContent);

        createMockFunctionFromContent(workerBody)(workerSelf);

        expect(
          await worker.sendToMethod<number, number>('doSomething', 2)
        ).toEqual(4);

        expect(
          await worker.sendToMethod<number, number>('doSomethingElse', 2)
        ).toEqual(5);
      });
    });

    describe('override', () => {
      it('Worker should correctly invalid previous messages', () => {
        expect.assertions(4);

        const workerContent: EasyWebWorkerBody<null> = (easyWorker) => {
          const countTo100 = (message: IEasyWebWorkerMessage) => {
            return setTimeout(() => {
              let count = 0;
              const intervalId = setInterval(() => {
                count += 1;
                if (count !== 100) return;

                clearInterval(intervalId);

                message.resolve();
              }, 1);
            }, 1);
          };

          easyWorker.onMessage(countTo100);
        };

        const worker = createWorker(workerContent);

        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const errorLogger = jest.fn();

        createMockFunctionFromContent(workerBody)(workerSelf);

        worker.send().then(callback1).catch(errorLogger);
        worker.send().then(callback2).catch(errorLogger);

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
        expect.assertions(4);

        const workerContent: EasyWebWorkerBody = (easyWorker) => {
          const countTo100 = (message: IEasyWebWorkerMessage) =>
            setTimeout(() => {
              let count = 0;
              const intervalId = setInterval(() => {
                count += 1;
                if (count !== 100) return;

                clearInterval(intervalId);
                message.resolve();
              }, 10);
            }, 1);

          easyWorker.onMessage(countTo100);
        };

        const worker = createWorker(workerContent);

        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const errorLogger = jest.fn();

        createMockFunctionFromContent(workerBody)(workerSelf);

        worker.send().then(callback1);
        worker.send().then(callback2).catch(errorLogger);

        await worker.overrideAfterCurrent().then(callback3);

        expect(callback1).toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalled();
        expect(errorLogger).toHaveBeenCalledTimes(1);
      });
    });

    describe('dispose', () => {
      it('should correctly dispose worker (remove worker and revokeObjectURL)', () => {
        expect.assertions(4);

        const workerContent: EasyWebWorkerBody = (easyWorker) => {
          const countTo100 = (message: IEasyWebWorkerMessage) =>
            setTimeout(() => {
              let count = 0;

              const intervalId = setInterval(() => {
                count += 1;

                if (count !== 100) return;

                clearInterval(intervalId);

                message.resolve();
              }, 1);
            }, 1);

          easyWorker.onMessage(countTo100);
        };

        const worker = createWorker(workerContent);

        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();
        const errorLogger = jest.fn();

        createMockFunctionFromContent(workerBody)(workerSelf);

        worker.send().then(callback1);
        worker.send().then(callback2).catch(errorLogger);

        return worker
          .overrideAfterCurrent()
          .then(callback3)
          .then(() => {
            expect(callback1).toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(callback3).toHaveBeenCalled();
            expect(errorLogger).toHaveBeenCalledTimes(1);
          });
      });
    });

    describe('cancel', () => {
      it('should correctly cancel worker', async () => {
        expect.assertions(2);

        const workerContent: EasyWebWorkerBody = (easyWorker) => {
          easyWorker.onMessage((message) => {
            setTimeout(() => {
              message.resolve();
            }, 1000);
          });
        };

        const worker = createWorker(workerContent);

        const callback1 = jest.fn();
        const errorLogger = jest.fn();

        createMockFunctionFromContent(workerBody)(workerSelf);

        await worker.send().then(callback1).cancel('cancel').catch(errorLogger);

        expect(callback1).not.toHaveBeenCalled();
        expect(errorLogger).toHaveBeenCalledWith('cancel');
      });
    });

    it('should cancel the message from inside the worker', async () => {
      expect.assertions(2);

      const workerContent: EasyWebWorkerBody = (easyWorker) => {
        easyWorker.onMessage((message) => {
          setTimeout(() => {
            message.cancel('cancel-from-worker');
          }, 1);
        });
      };

      const worker = createWorker(workerContent);

      const callback1 = jest.fn();
      const errorLogger = jest.fn();

      createMockFunctionFromContent(workerBody)(workerSelf);

      await worker.send().then(callback1).catch(errorLogger);

      expect(callback1).not.toHaveBeenCalled();
      expect(errorLogger).toHaveBeenCalledWith('cancel-from-worker');
    });
  });
});
