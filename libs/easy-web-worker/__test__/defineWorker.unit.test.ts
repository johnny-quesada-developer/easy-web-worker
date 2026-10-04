import { unwrap, defineWorker } from 'easy-web-worker/defineWorker';

/**
 * defineWorker.test.ts runs the worker inside a real worker thread.
 * Here the same code runs in the test thread against a fake `self`, so every message path can be asserted directly.
 */
describe('defineWorker (worker scope)', () => {
  const globalAny: any = globalThis;

  let selfMock: {
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    importScripts: ReturnType<typeof vi.fn>;
    onmessage: (event: unknown) => void;
  };

  let previousSelf: unknown;

  const send = (messageId: string, method?: string, payload?: unknown) => {
    selfMock.onmessage({
      data: {
        messageId,
        __is_easy_web_worker_message__: true,
        method,
        execution: { payload },
      },
    });
  };

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

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

  describe('plain functions', () => {
    it('should resolve the message with the returned value', () => {
      defineWorker(() => ({
        double: (value: number) => value * 2,
      }));

      send('m1', 'double', 21);

      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [42] } },
        []
      );
    });

    it('should resolve without a result when the method returns nothing', () => {
      defineWorker(() => ({
        nothing: () => {},
      }));

      send('m1', 'nothing');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [] } },
        []
      );
    });

    it('should resolve the message when the returned promise resolves', async () => {
      defineWorker(() => ({
        double: async (value: number) => value * 2,
      }));

      send('m1', 'double', 21);

      // the message waits for the promise
      expect(selfMock.postMessage).not.toHaveBeenCalled();

      await flushPromises();

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [42] } },
        []
      );
    });

    it('should reject the message when the method throws', () => {
      const error = new Error('method error');

      defineWorker(() => ({
        fail: () => {
          throw error;
        },
      }));

      expect(() => send('m1', 'fail')).not.toThrow();

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', rejected: { reason: error } },
        []
      );
    });

    it('should reject the message when the returned promise rejects', async () => {
      const error = new Error('method error');

      defineWorker(() => ({
        fail: async () => {
          throw error;
        },
      }));

      send('m1', 'fail');

      await flushPromises();

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', rejected: { reason: error } },
        []
      );
    });

    it('should route each message to its method', () => {
      const first = vi.fn(() => 'first');
      const second = vi.fn((_payload: string) => 'second');

      defineWorker(() => ({ first, second }));

      send('m1', 'second', 'payload');

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      expect(second.mock.calls[0][0]).toEqual('payload');
    });
  });

  describe('onMessage((payload, message) => result)', () => {
    it('should return the same function', () => {
      const handler = () => 'result';

      defineWorker(({ onMessage }) => {
        expect(onMessage(handler)).toBe(handler);

        return {};
      });
    });

    it('should receive the message as second parameter', () => {
      defineWorker(({ onMessage }) => ({
        count: onMessage((to: number, message) => {
          message.reportProgress(50, { step: 1 });

          return `${message.method}:${message.payload}:${to}`;
        }),
      }));

      send('m1', 'count', 4);

      expect(selfMock.postMessage).toHaveBeenNthCalledWith(
        1,
        {
          messageId: 'm1',
          progress: { percentage: 50, payload: { step: 1 } },
        },
        []
      );

      expect(selfMock.postMessage).toHaveBeenNthCalledWith(
        2,
        { messageId: 'm1', resolved: { payload: ['count:4:4'] } },
        []
      );
    });

    it('should receive the event as third parameter', () => {
      const handler = vi.fn(
        (_payload: string, _message: unknown, _event: unknown) => 'result'
      );

      defineWorker(({ onMessage }) => ({
        plain: (payload: string, message, event) =>
          handler(payload, message, event),

        wrapped: onMessage((payload: string, message, event) =>
          handler(payload, message, event)
        ),
      }));

      send('m1', 'plain', 'payload');
      send('m2', 'wrapped', 'payload');

      handler.mock.calls.forEach(([payload, message, event], index) => {
        const messageId = `m${index + 1}`;

        expect(payload).toEqual('payload');
        expect((message as { messageId: string }).messageId).toEqual(messageId);

        // the original event of the worker
        expect(event).toEqual({
          data: {
            messageId,
            __is_easy_web_worker_message__: true,
            method: index === 0 ? 'plain' : 'wrapped',
            execution: { payload: 'payload' },
          },
        });
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it.each(['resolve', 'reject', 'cancel'] as const)(
      'should not complete the message again when the method calls %s',
      (action) => {
        const buffer = new ArrayBuffer(8);

        defineWorker(({ onMessage }) => ({
          transfer: onMessage((_payload: null, message) => {
            message[action](buffer, [buffer]);

            return 'ignored';
          }),
        }));

        send('m1', 'transfer');

        expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
        expect(selfMock.postMessage.mock.calls[0][1]).toEqual([buffer]);
      }
    );

    it('should not complete the message when it was canceled while the method was running', async () => {
      const errorLogger = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onCancel = vi.fn();

      defineWorker(({ onMessage }) => ({
        slow: onMessage(async (_payload: null, message) => {
          message.onCancel(onCancel);

          await flushPromises();

          return 'done';
        }),
      }));

      send('m1', 'slow');

      // cancelation from the main thread
      selfMock.onmessage({
        data: {
          messageId: 'm1',
          __is_easy_web_worker_message__: true,
          cancelation: { reason: 'reason' },
        },
      });

      await flushPromises();
      await flushPromises();

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', worker_cancelation: { reason: 'reason' } },
        []
      );

      // the result of the method was ignored without complaining
      expect(errorLogger).not.toHaveBeenCalled();
    });
  });

  describe('onMessage<TPayload, TResult>().handle((message) => { ... })', () => {
    it('should receive only the message and the event', () => {
      const callback = vi.fn();

      defineWorker(({ onMessage }) => ({
        later: onMessage<string, string>().handle(callback),
      }));

      send('m1', 'later', 'payload');

      const [message, event] = callback.mock.calls[0];

      expect(message.messageId).toEqual('m1');
      expect(message.method).toEqual('later');
      expect(message.payload).toEqual('payload');
      expect(event.data.messageId).toEqual('m1');
    });

    it('should not complete the message until the callback does it', async () => {
      let pendingMessage = null;

      defineWorker(({ onMessage }) => ({
        later: onMessage<null, string>().handle((message) => {
          pendingMessage = message;

          return 'ignored';
        }),
      }));

      send('m1', 'later');

      await flushPromises();

      expect(selfMock.postMessage).not.toHaveBeenCalled();
      expect(pendingMessage.isPending()).toEqual(true);

      pendingMessage.resolve('done');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: ['done'] } },
        []
      );
    });
  });

  describe('unwrap', () => {
    it('should give access to the static worker', () => {
      const worker = defineWorker(() => ({
        hello: () => 'hello',
      }));

      const staticWorker = unwrap(worker);

      expect(typeof staticWorker.onMessage).toEqual('function');
      expect(typeof staticWorker.close).toEqual('function');
      expect(typeof staticWorker.importScripts).toEqual('function');
    });

    it('should not expose the methods or the worker as properties', () => {
      const worker = defineWorker(() => ({
        hello: () => 'hello',
      }));

      expect(Object.keys(worker)).toEqual([]);
    });

    it('should define the callback of the messages without a method', () => {
      const worker = defineWorker(() => ({
        hello: () => 'hello',
      }));

      unwrap(worker).onMessage((message) => {
        message.resolve();
      });

      send('m1');

      expect(selfMock.postMessage).toHaveBeenCalledWith(
        { messageId: 'm1', resolved: { payload: [] } },
        []
      );
    });

    it('should import scripts and close the worker', () => {
      const worker = defineWorker(({ onMessage }) => ({
        pending: onMessage<null, void>().handle(() => {}),
      }));

      unwrap(worker).importScripts('script1.js', 'script2.js');

      expect(selfMock.importScripts).toHaveBeenCalledWith(
        'script1.js',
        'script2.js'
      );

      send('m1', 'pending');

      unwrap(worker).close();

      expect(selfMock.close).toHaveBeenCalledTimes(1);
      expect(selfMock.postMessage.mock.calls[0][0].rejected.reason).toEqual(
        new Error('worker closed')
      );
    });
  });
});
