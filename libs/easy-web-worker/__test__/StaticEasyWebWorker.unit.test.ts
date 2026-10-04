import {
  StaticEasyWebWorker,
  createStaticEasyWebWorker,
} from 'easy-web-worker';

/**
 * StaticEasyWebWorker.test.ts runs the static worker inside a real worker thread.
 * Here the same code runs in the test thread against a fake `self`, so every message path can be asserted directly.
 */
describe('StaticEasyWebWorker (worker scope)', () => {
  const globalAny: any = globalThis;

  let selfMock: {
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    importScripts: ReturnType<typeof vi.fn>;
    onmessage: (event: unknown) => void;
  };

  let previousSelf: unknown;

  const send = (messageId: string, payload?: unknown, method?: string) => {
    selfMock.onmessage({
      data: {
        messageId,
        __is_easy_web_worker_message__: true,
        method,
        execution: { payload },
      },
    });
  };

  const cancelFromMainThread = (messageId: string, reason?: unknown) => {
    selfMock.onmessage({
      data: {
        messageId,
        __is_easy_web_worker_message__: true,
        cancelation: { reason },
      },
    });
  };

  const catchThrown = (callback: () => void): any => {
    try {
      callback();
    } catch (error) {
      return error;
    }

    return undefined;
  };

  beforeEach(() => {
    previousSelf = globalAny.self;

    selfMock = {
      postMessage: vi.fn(),
      close: vi.fn(),
      importScripts: vi.fn(),
      onmessage: null,
    };

    globalAny.self = selfMock;
  });

  afterEach(() => {
    globalAny.self = previousSelf;
  });

  describe('message routing', () => {
    it('should execute the default callback and post the result', () => {
      createStaticEasyWebWorker<number, number>((message) => {
        message.resolve(message.payload + 1);
      });

      send('m1', 1);

      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [2] } },
        []
      );
    });

    it('should pass the message and the original event to the callback', () => {
      const callback = vi.fn();

      new StaticEasyWebWorker(callback);

      send('m1', 'payload', undefined);

      const [message, event] = callback.mock.calls[0];

      expect(message.messageId).toEqual('m1');
      expect(message.payload).toEqual('payload');
      expect(event.data.messageId).toEqual('m1');
    });

    it('should post an empty payload when resolving without a result', () => {
      createStaticEasyWebWorker((message) => {
        message.resolve();
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [] } },
        []
      );
    });

    it('should route the message to the callback of the requested method', () => {
      const defaultCallback = vi.fn();
      const methodCallback = vi.fn();

      const worker = createStaticEasyWebWorker(defaultCallback);

      worker.onMessage('doSomething', methodCallback);

      send('m1', null, 'doSomething');

      expect(methodCallback).toHaveBeenCalledTimes(1);
      expect(methodCallback.mock.calls[0][0].method).toEqual('doSomething');
      expect(defaultCallback).not.toHaveBeenCalled();
    });

    it('should allow to define the default callback after the creation', () => {
      const callback = vi.fn();

      const worker = createStaticEasyWebWorker();

      worker.onMessage(callback);

      send('m1');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should throw if there is no default callback', () => {
      createStaticEasyWebWorker();

      const error = catchThrown(() => send('m1'));

      expect(error.message).toEqual('Error while processing message id: m1');
      expect(error.event.data.messageId).toEqual('m1');
      expect(selfMock.postMessage).not.toHaveBeenCalled();
    });

    it('should throw if the requested method was not defined', () => {
      createStaticEasyWebWorker(vi.fn());

      const error = catchThrown(() => send('m1', null, 'unknownMethod'));

      expect(error.message).toEqual('Error while processing message id: m1');
    });

    it('should ignore messages that were not sent by an EasyWebWorker', () => {
      const callback = vi.fn();

      createStaticEasyWebWorker(callback);

      selfMock.onmessage(undefined);
      selfMock.onmessage({});
      selfMock.onmessage({ data: { some: 'value' } });
      selfMock.onmessage({ data: { messageId: 'm1' } });
      selfMock.onmessage({ data: { __is_easy_web_worker_message__: true } });

      expect(callback).not.toHaveBeenCalled();
      expect(selfMock.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('message actions', () => {
    it('should post the rejection reason', () => {
      createStaticEasyWebWorker((message) => {
        message.reject('reason');
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', rejected: { reason: 'reason' } },
        []
      );
    });

    it('should post the cancelation when is canceled from inside the worker', () => {
      createStaticEasyWebWorker((message) => {
        message.cancel('reason');
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', worker_cancelation: { reason: 'reason' } },
        []
      );
    });

    it('should post the progress and keep the message pending', () => {
      let currentMessage = null;

      createStaticEasyWebWorker((message) => {
        currentMessage = message;

        message.reportProgress(50, 'half');
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', progress: { percentage: 50, payload: 'half' } },
        []
      );

      expect(currentMessage.isPending()).toEqual(true);
      expect(currentMessage.getStatus()).toEqual('pending');
    });

    it('should forward the transferable objects', () => {
      const buffer = new ArrayBuffer(8);

      createStaticEasyWebWorker<null, ArrayBuffer>((message) => {
        message.reportProgress(1, buffer, [buffer]);
        message.resolve(buffer, [buffer]);
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenNthCalledWith(
        1,
        { messageId: 'm1', progress: { percentage: 1, payload: buffer } },
        [buffer]
      );

      expect(selfMock.postMessage).toHaveBeenNthCalledWith(
        2,
        { messageId: 'm1', resolved: { payload: [buffer] } },
        [buffer]
      );
    });

    it.each([
      ['resolve', 'resolved'],
      ['reject', 'rejected'],
      ['cancel', 'worker_cancelation'],
    ])('should update the status after %s', (action, status) => {
      let currentMessage = null;

      createStaticEasyWebWorker((message) => {
        currentMessage = message;
      });

      send('m1');

      expect(currentMessage.isPending()).toEqual(true);

      currentMessage[action]();

      expect(currentMessage.isPending()).toEqual(false);
      expect(currentMessage.getStatus()).toEqual(status);
    });

    it.each(['resolve', 'reject', 'cancel', 'reportProgress'])(
      'should not post again when %s is called after the message was completed',
      (action) => {
        const errorLogger = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        let currentMessage = null;

        createStaticEasyWebWorker((message) => {
          currentMessage = message;

          message.resolve();
        });

        send('m1');

        currentMessage[action]();

        expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
        expect(errorLogger).toHaveBeenCalledTimes(1);
        expect(currentMessage.getStatus()).toEqual('resolved');
      }
    );
  });

  describe('cancelation from the main thread', () => {
    it('should cancel the pending message', () => {
      const onCancel = vi.fn();

      createStaticEasyWebWorker((message) => {
        message.onCancel(onCancel);
      });

      send('m1');
      cancelFromMainThread('m1', 'reason');

      expect(onCancel).toHaveBeenCalledTimes(1);

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', worker_cancelation: { reason: 'reason' } },
        []
      );
    });

    it('should ignore the cancelation of a message that is not pending', () => {
      const onCancel = vi.fn();

      createStaticEasyWebWorker((message) => {
        message.onCancel(onCancel);
        message.resolve();
      });

      send('m1');

      cancelFromMainThread('m1', 'reason');
      cancelFromMainThread('unknown', 'reason');

      expect(onCancel).not.toHaveBeenCalled();

      // only the resolution of the message
      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should only cancel the requested message', () => {
      const messages = new Map<string, any>();

      createStaticEasyWebWorker((message) => {
        messages.set(message.messageId, message);
      });

      send('m1');
      send('m2');

      cancelFromMainThread('m1');

      expect(messages.get('m1').isPending()).toEqual(false);
      expect(messages.get('m2').isPending()).toEqual(true);
    });
  });

  describe('subscriptions', () => {
    it.each([
      ['onResolve', 'resolve'],
      ['onReject', 'reject'],
      ['onCancel', 'cancel'],
    ])('should execute %s and onFinalize callbacks', (subscription, action) => {
      const callback = vi.fn();
      const onFinalize = vi.fn();

      createStaticEasyWebWorker((message) => {
        message[subscription](callback);
        message.onFinalize(onFinalize);

        message[action]();
      });

      send('m1');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(onFinalize).toHaveBeenCalledTimes(1);
    });

    it('should execute onProgress callbacks without finalizing the message', () => {
      const onProgress = vi.fn();
      const onFinalize = vi.fn();

      createStaticEasyWebWorker((message) => {
        message.onProgress(onProgress);
        message.onFinalize(onFinalize);

        message.reportProgress(10);
        message.reportProgress(20);
      });

      send('m1');

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onFinalize).not.toHaveBeenCalled();
    });

    it('should only execute the callbacks of the completed action', () => {
      const onResolve = vi.fn();
      const onReject = vi.fn();
      const onCancel = vi.fn();

      createStaticEasyWebWorker((message) => {
        message.onResolve(onResolve);
        message.onReject(onReject);
        message.onCancel(onCancel);

        message.reject();
      });

      send('m1');

      expect(onReject).toHaveBeenCalledTimes(1);
      expect(onResolve).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should execute every callback subscribed to the same action', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      createStaticEasyWebWorker((message) => {
        message.onResolve(callback1);
        message.onResolve(callback2);

        message.resolve();
      });

      send('m1');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not execute a callback after unsubscribe', () => {
      const callback = vi.fn();

      createStaticEasyWebWorker((message) => {
        const unsubscribe = message.onResolve(callback);

        unsubscribe();

        message.resolve();
      });

      send('m1');

      expect(callback).not.toHaveBeenCalled();
      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should not post the message if a callback throws', () => {
      const callbackError = new Error('callback error');

      let currentMessage = null;

      createStaticEasyWebWorker((message) => {
        currentMessage = message;

        message.onResolve(() => {
          throw callbackError;
        });
      });

      send('m1');

      const error = catchThrown(() => currentMessage.resolve());

      expect(error.message).toEqual('Error while processing message id: m1');
      expect(error.error).toBe(callbackError);
      expect(error.when).toEqual('onResolve');
      expect(error.messageType).toEqual('resolved');
      expect(selfMock.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should reject the pending messages and close the worker', () => {
      const worker = createStaticEasyWebWorker(() => {});

      send('m1');
      send('m2');

      worker.close();

      expect(selfMock.close).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage).toHaveBeenCalledTimes(2);

      const [firstMessage] = selfMock.postMessage.mock.calls[0];
      const [secondMessage] = selfMock.postMessage.mock.calls[1];

      expect(firstMessage.messageId).toEqual('m1');
      expect(firstMessage.rejected.reason).toEqual(new Error('worker closed'));
      expect(secondMessage.messageId).toEqual('m2');
    });

    it('should not reject the messages that were already completed', () => {
      const worker = createStaticEasyWebWorker((message) => {
        message.resolve();
      });

      send('m1');

      worker.close();

      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
      expect(selfMock.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('importScripts', () => {
    it('should import the scripts into the worker scope', () => {
      const worker = createStaticEasyWebWorker();

      worker.importScripts('script1.js', 'script2.js');

      expect(selfMock.importScripts).toHaveBeenCalledWith(
        'script1.js',
        'script2.js'
      );
    });
  });
});
