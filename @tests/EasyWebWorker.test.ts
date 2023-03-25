import EasyWebWorker from '../src/EasyWebWorker';
import {
  IWorkerConfig,
  EasyWebWorkerBody,
  IEasyWebWorkerMessage,
} from '../src/EasyWebWorkerTypes';
import * as testFixtures from './testFixtures';

const replaceAll = (target: string, search: string, replacement: string) => {
  return target.split(search).join(replacement);
};

const {
  getMockBlobContent,
  WorkerMock,
  dummyUrl,
  CreateMockFunctionFromContent: createMockFunctionFromContent,
} = testFixtures;

describe('EasyWebWorker', () => {
  let blobSpy: jest.SpyInstance;

  beforeEach(() => {
    blobSpy = jest.spyOn(testFixtures, 'MockBlob');
  });

  describe('constructor', () => {
    const scripts = ['fake.js'];
    const workerName = 'workerTest';
    const workerContent: EasyWebWorkerBody<null> = (easyWorker, context) => {
      context.globalPropertyTest = 'globalPropertyTest';
      easyWorker.onMessage((message) => {
        message.resolve();
      });
    };

    it('properties should be correctly populated', () => {
      const worker = new EasyWebWorker(workerContent, {
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
            content.join('').replace(/\s+/g, ''),
            '"',
            "'"
          );

          const sanitizedMock = replaceAll(
            getMockBlobContent().replace(/\s+/g, ''),
            '"',
            "'"
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
        workerBody = `${content.join('')} return easyWorker;`;
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

      expect(easyWorkerInstance.onMessageCallback).toBeDefined();

      expect(importScripts).toHaveBeenCalledWith(scripts);
      expect(onmessage).not.toHaveBeenCalled();
      expect(postMessage).not.toHaveBeenCalled();
      expect(workerContext.globalPropertyTest).toEqual('globalPropertyTest');
    });

    it('worker should initialize correctly workerBody[] (multiple body sources)', () => {
      let workerBody: string = '';

      blobSpy.mockImplementation((content: string[]) => {
        workerBody = `${content.join('')} return easyWorker;`;
      });

      const secondWorkerContent: EasyWebWorkerBody = (easyWorker, context) => {
        context.testFunction = (increase: number) => increase + 1;
      };

      const worker = new EasyWebWorker([secondWorkerContent, workerContent], {
        name: workerName,
        scripts,
      });

      const workerContext = {
        importScripts: jest.fn(),
        testFunction: null,
      };

      const easyWorkerInstance =
        createMockFunctionFromContent(workerBody)(workerContext);

      expect(easyWorkerInstance.onMessageCallback).toBeDefined();
      expect((workerContext as any).testFunction(2)).toEqual(3);
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
        workerBody = `${content.join('')} return easyWorker;`;
      });

      workerSelf = {
        importScripts: jest.fn(),
        onmessage: null,
        postMessage: (
          event: Partial<{
            messageId: string;
            progressPercentage: number;
            payload: any;
          }>
        ) => {
          const { messageId, progressPercentage, payload } = event;

          setTimeout(() => {
            _worker.worker.onmessage?.call(_worker.worker, {
              data: { messageId, payload, progressPercentage },
            });
          }, 1);
        },
      };

      jest
        .spyOn(WorkerMock.prototype, 'postMessage')
        .mockImplementation((event) => {
          const { messageId, payload } = event;

          setTimeout(() => {
            workerSelf.onmessage({ data: { messageId, payload } });
          }, 1);
        });
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
            }, 10);
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
          easyWorker.onMessage(context.countTo100);
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

    describe('override', () => {
      it('Worker should correctly invalid previous messages', () => {
        expect.assertions(4);

        const workerContent: EasyWebWorkerBody<null> = (easyWorker) => {
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
  });
});
