import { Worker } from "node:worker_threads";

import {
  EasyWebWorker,
  EasyWebWorkerBody,
  IEasyWebWorkerMessage,
  createEasyWebWorker,
} from "../src";

describe("EasyWebWorker", () => {
  beforeEach(() => {});

  describe("constructor", () => {
    const workerName = "workerTest";

    const workerContent: EasyWebWorkerBody = (easyWorker, context) => {
      context.globalPropertyTest = "globalPropertyTest";

      easyWorker.onMessage((message) => {
        message.resolve();
      });
    };

    it("properties should be correctly populated", () => {
      const worker = createEasyWebWorker(workerContent, {
        workerOptions: {
          name: workerName,
        },
      });

      expect(worker.config.workerOptions?.name).toEqual(workerName);
      expect(worker.workers[0]).toBeInstanceOf(Worker);
      expect(worker.workers.length).toBe(1);
    });

    it("worker should initialize correctly", () => {
      const worker = new EasyWebWorker(workerContent, {
        workerOptions: {
          name: workerName,
        },
      });

      expect(worker.workerUrl).toBeDefined();
      expect(worker.config.keepAlive).toEqual(true);
      expect(worker.config.warmUpWorkers).toEqual(true);
      expect(worker.workers.length).toEqual(1);
      expect(worker.workers[0]).toBeInstanceOf(Worker);
    });

    it("worker should initialize correctly workerBody[] (multiple body sources)", async () => {
      const secondWorkerContent: EasyWebWorkerBody<null, boolean> = (
        easyWorker,
        context
      ) => {
        easyWorker.onMessage((message) => {
          message.resolve(context.globalPropertyTest === "globalPropertyTest");
        });
      };

      const worker = new EasyWebWorker<null, boolean>(
        [workerContent, secondWorkerContent],
        {
          workerOptions: {
            name: workerName,
          },
        }
      );

      const isGlobalPropertyTestDefined = await worker.send();

      expect(isGlobalPropertyTestDefined).toEqual(true);
    });
  });

  describe("Methods", () => {
    beforeEach(() => {});

    describe("send", () => {
      it("worker should run correctly messages", async () => {
        expect.assertions(3);

        const worker = createEasyWebWorker<number, number>((easyWorker) => {
          easyWorker.onMessage((message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });
        });

        expect(await worker.send(2)).toEqual(4);
        expect(await worker.send(8)).toEqual(10);
        expect(await worker.send(-4)).toEqual(-2);
      });

      it("should correctly report progress on children promises", async () => {
        expect.assertions(1);

        const worker = createEasyWebWorker<number, number>((easyWorker) => {
          easyWorker.onMessage((message) => {
            message.reportProgress(1);

            message.resolve(1);
          });
        });

        const progressLogger = jest.fn();

        return worker
          .send(1)
          .onProgress(() => progressLogger())
          .then(() => {})
          .onProgress(() => progressLogger())
          .then(() => {})
          .onProgress(() => progressLogger())
          .then(() => {
            expect(progressLogger).toHaveBeenCalledTimes(3);
          });
      });

      it("worker should correctly report progress", async () => {
        expect.assertions(2);

        const onProgressSpy = jest.fn();

        const worker = createEasyWebWorker<null, number>((easyWorker) => {
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
        });

        expect(await worker.send().onProgress(onProgressSpy)).toEqual(100);
        expect(onProgressSpy).toHaveBeenCalledTimes(100);
      });

      it("worker content should run correctly messages workerBody[] (multiple body sources)", async () => {
        expect.assertions(2);

        const onProgressSpy = jest.fn(() => {});

        const worker = createEasyWebWorker<null, number>([
          (_easyWorker, context) => {
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
          },
          (easyWorker, context) => {
            easyWorker.onMessage(context.countTo100 as any);
          },
        ]);

        expect(await worker.send().onProgress(onProgressSpy)).toEqual(100);
        expect(onProgressSpy).toHaveBeenCalledTimes(100);
      });
    });

    describe("sendToMethod", () => {
      it("worker should run correctly specific method", async () => {
        expect.assertions(3);

        const worker = createEasyWebWorker((easyWorker) => {
          easyWorker.onMessage<number, number>("doSomething", (message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });
        });

        expect(await worker.sendToMethod("doSomething", 2)).toEqual(4);
        expect(await worker.sendToMethod("doSomething", 8)).toEqual(10);
        expect(await worker.sendToMethod("doSomething", -4)).toEqual(-2);
      });

      it("should be able to cancel a specific method execution", async () => {
        expect.assertions(2);

        const worker = createEasyWebWorker((easyWorker) => {
          let wasCanceled = false;

          easyWorker.onMessage<number, number>("doSomething", (message) => {
            message.onCancel(() => {
              wasCanceled = true;
            });

            setTimeout(() => {
              if (!message.isPending()) return;

              const { payload } = message;

              message.resolve(payload + 2);
            }, 1000);
          });

          easyWorker.onMessage<null, boolean>("getWasCanceled", (message) => {
            message.resolve(wasCanceled);
          });
        });

        const errorLogger = jest.fn();

        await worker
          .sendToMethod("doSomething", 2)
          .cancel()
          .catch(() => errorLogger());

        const wasCanceled = await worker.sendToMethod("getWasCanceled");

        expect(wasCanceled).toEqual(true);
        expect(errorLogger).toHaveBeenCalledTimes(1);
      });

      it("should correctly subscribe multiple methods", async () => {
        expect.assertions(2);

        const worker = createEasyWebWorker((easyWorker) => {
          easyWorker.onMessage<number, number>("doSomething", (message) => {
            const { payload } = message;

            message.resolve(payload + 2);
          });

          easyWorker.onMessage<number, number>("doSomethingElse", (message) => {
            const { payload } = message;

            message.resolve(payload + 3);
          });
        });

        expect(
          await worker.sendToMethod<number, number>("doSomething", 2)
        ).toEqual(4);

        expect(
          await worker.sendToMethod<number, number>("doSomethingElse", 2)
        ).toEqual(5);
      });

      describe("override", () => {
        it("Worker should correctly invalid previous messages", () => {
          expect.assertions(4);

          const worker = createEasyWebWorker((easyWorker) => {
            const countTo100 = (message: IEasyWebWorkerMessage) => {
              return setTimeout(() => {
                let count = 0;
                const intervalId = setInterval(() => {
                  if (!message.isPending()) return;

                  count += 1;
                  if (count !== 100) return;

                  clearInterval(intervalId);

                  message.resolve();
                }, 1);

                message.onCancel(() => {
                  clearInterval(intervalId);
                });
              }, 1);
            };

            easyWorker.onMessage(countTo100);
          });

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const callback3 = jest.fn();
          const errorLogger = jest.fn();

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

      describe("overrideAfterCurrent", () => {
        it("Worker should correctly invalid previous messages after current execution", async () => {
          expect.assertions(4);

          const worker = createEasyWebWorker((easyWorker) => {
            const countTo100 = (message: IEasyWebWorkerMessage) =>
              setTimeout(() => {
                let count = 0;
                const intervalId = setInterval(() => {
                  if (!message.isPending()) return;

                  count += 1;
                  if (count !== 100) return;

                  clearInterval(intervalId);
                  message.resolve();
                }, 10);

                message.onCancel(() => {
                  clearInterval(intervalId);
                });
              }, 1);

            easyWorker.onMessage(countTo100);
          });

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const callback3 = jest.fn();
          const errorLogger = jest.fn();

          worker.send().then(callback1);
          worker.send().then(callback2).catch(errorLogger);

          await worker.overrideAfterCurrent().then(callback3);

          expect(callback1).toHaveBeenCalled();
          expect(callback2).not.toHaveBeenCalled();
          expect(callback3).toHaveBeenCalled();
          expect(errorLogger).toHaveBeenCalledTimes(1);
        });

        it("Worker should correctly invalid previous messages after current execution (with multiple workers)", async () => {
          expect.assertions(4);

          const worker = createEasyWebWorker((easyWorker) => {
            const countTo100 = (message: IEasyWebWorkerMessage) =>
              setTimeout(() => {
                let count = 0;

                const intervalId = setInterval(() => {
                  if (!message.isPending()) return;

                  count += 1;

                  if (count !== 100) return;

                  clearInterval(intervalId);

                  message.resolve();
                }, 1);

                message.onCancel(() => {
                  clearInterval(intervalId);
                });
              }, 1);

            easyWorker.onMessage(countTo100);
          });

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const callback3 = jest.fn();
          const errorLogger = jest.fn();

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

      describe("dispose", () => {
        it("should correctly dispose worker (remove worker and revokeObjectURL)", async () => {
          expect.assertions(4);

          const worker = createEasyWebWorker((easyWorker) => {
            const countTo100 = (message: IEasyWebWorkerMessage) => {
              return setTimeout(() => {
                let count = 0;
                const intervalId = setInterval(() => {
                  if (!message.isPending()) return;

                  count += 1;
                  if (count !== 100) return;

                  clearInterval(intervalId);

                  message.resolve();
                }, 1);

                message.onCancel(() => {
                  clearInterval(intervalId);
                });
              }, 1);
            };

            easyWorker.onMessage(countTo100);
          });

          const callback1 = jest.fn();
          const callback2 = jest.fn();
          const errorLogger = jest.fn();

          worker.send().then(callback1).catch(errorLogger);
          worker.send().then(callback2).catch(errorLogger);

          await worker.dispose();

          expect(worker.workers.length).toEqual(0);
          expect(errorLogger).toHaveBeenCalledTimes(2);
          expect(callback1).not.toHaveBeenCalled();
          expect(callback2).not.toHaveBeenCalled();
        });
      });

      describe("cancel", () => {
        it("should correctly cancel worker", async () => {
          expect.assertions(2);

          const worker = createEasyWebWorker((easyWorker) => {
            easyWorker.onMessage((message) => {
              setTimeout(() => {
                if (!message.isPending()) return;

                message.resolve();
              }, 1000);
            });
          });

          const callback1 = jest.fn();
          const errorLogger = jest.fn();

          await worker
            .send()
            .then(callback1)
            .cancel("cancel")
            .catch(errorLogger);

          expect(callback1).not.toHaveBeenCalled();
          expect(errorLogger).toHaveBeenCalledWith("cancel");
        });
      });

      it("should cancel the message from inside the worker", async () => {
        expect.assertions(2);

        const worker = createEasyWebWorker((easyWorker) => {
          easyWorker.onMessage((message) => {
            message.cancel("cancel-from-worker");
          });
        });

        const callback1 = jest.fn();
        const errorLogger = jest.fn();

        await worker.send().then(callback1).catch(errorLogger);

        expect(callback1).not.toHaveBeenCalled();
        expect(errorLogger).toHaveBeenCalledWith("cancel-from-worker");
      });

      ["onResolve", "onCancel", "onProgress", "onFinalize"].forEach(
        (callbackKey) => {
          it(`should correctly subscribe to ${callbackKey}`, async () => {
            expect.assertions(5);

            const worker = createEasyWebWorker(
              (easyWorker, context) => {
                let previousMessage: IEasyWebWorkerMessage | null = null;
                let didCallbackWasCalled = false;

                const [callback] = context.primitiveParameters as unknown[] as [
                  keyof IEasyWebWorkerMessage
                ];

                easyWorker.onMessage((message) => {
                  previousMessage = message;

                  message[callback as any](() => {
                    didCallbackWasCalled = true;
                  });
                });

                easyWorker.onMessage<null, boolean>(
                  "getDidCallbackWasCalled",
                  (message) => {
                    message.resolve(didCallbackWasCalled);
                  }
                );

                easyWorker.onMessage("resolvePrevious", (message) => {
                  if (callback === "onProgress") {
                    previousMessage?.reportProgress(1);
                  }

                  previousMessage?.[
                    callback === "onCancel" ? "cancel" : "resolve"
                  ]();

                  message.resolve();
                });
              },
              {
                primitiveParameters: [callbackKey],
              }
            );

            const callback1 = jest.fn();
            const errorLogger = jest.fn();

            worker.send().then(callback1).catch(errorLogger);

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(callback1).not.toHaveBeenCalled();

            let didCallbackWasCalled = await worker.sendToMethod(
              "getDidCallbackWasCalled"
            );

            expect(didCallbackWasCalled).toEqual(false);

            await worker.sendToMethod("resolvePrevious").then(callback1);

            didCallbackWasCalled = await worker.sendToMethod(
              "getDidCallbackWasCalled"
            );

            expect(callback1).toBeCalledTimes(
              callbackKey === "onCancel" ? 1 : 2
            );
            expect(didCallbackWasCalled).toEqual(true);
            expect(errorLogger).toHaveBeenCalledTimes(
              callbackKey === "onCancel" ? 1 : 0
            );
          });
        }
      );

      describe("transferable", () => {
        type TPayload = {
          arrayBuffer: ArrayBuffer;
          action;
        };

        let worker: EasyWebWorker<TPayload, TPayload>;

        beforeEach(() => {
          worker = createEasyWebWorker<TPayload, TPayload>((easyWorker) => {
            easyWorker.onMessage((message) => {
              const { arrayBuffer, action } = message.payload;

              if (action === "reportProgress") {
                message.reportProgress(50, message.payload, [arrayBuffer]);

                message.resolve(message.payload);

                return;
              }

              message[action](
                {
                  arrayBuffer,
                  action,
                },
                [arrayBuffer]
              );
            });
          });
        });

        (
          ["resolve", "reject", "cancel", "reportProgress"] as (
            | "resolve"
            | "reject"
            | "cancel"
            | "reportProgress"
          )[]
        ).forEach((action) => {
          it(`should transfer a big array buffer when action is ${action}`, async () => {
            expect.assertions(action === "reportProgress" ? 5 : 3);

            const errorLogger = jest.fn();
            const progressLogger = jest.fn();
            const bigArrayBuffer = new ArrayBuffer(1000000);

            type TPayload = {
              arrayBuffer: ArrayBuffer;
              action;
            };

            let progressMetadata: TPayload = null as unknown as TPayload;

            const result = await worker
              .send(
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

            if (action === "resolve") {
              expect(errorLogger).not.toHaveBeenCalled();
              expect(progressLogger).not.toHaveBeenCalled();
            }

            if (action === "reject" || action === "cancel") {
              expect(errorLogger).toHaveBeenCalledTimes(1);
              expect(progressLogger).not.toHaveBeenCalled();
            }

            if (action === "reportProgress") {
              expect(progressLogger).toHaveBeenCalledWith(50);
              expect(errorLogger).not.toHaveBeenCalled();
              expect(bigArrayBuffer).toStrictEqual(
                progressMetadata?.arrayBuffer
              );
              expect(bigArrayBuffer).toStrictEqual(result.arrayBuffer);
            }

            expect(result.arrayBuffer).toStrictEqual(bigArrayBuffer);
          });
        });
      });
    });
  });
});
