import './workerThreadScope';
import {
  unwrap,
  defineWorker,
  type IEasyWebWorkerMessage,
} from 'easy-web-worker/defineWorker';

type SubscriptionKey = 'onResolve' | 'onCancel' | 'onProgress' | 'onFinalize';

export type TransferPayload = {
  arrayBuffer: ArrayBuffer;
  action: 'resolve' | 'reject' | 'cancel' | 'reportProgress';
};

/**
 * Same worker as StaticEasyWebWorker.worker.js, written with defineWorker.
 */
const asyncOperationState = {
  asyncOperationWasCalled: false,
  didAsyncOperationFinish: false,
  didAsyncOperationCancel: false,
};

let count = 0;
let previousMessage: IEasyWebWorkerMessage<SubscriptionKey, void> = null;
let didCallbackWasCalled = false;
let callbackKey: SubscriptionKey = null;

const worker = defineWorker(({ onMessage }) => ({
  hello: () => 'Hello from defineWorker!',

  actionWithPayload: (name: string) => `Hello ${name}!`,

  progressTest: onMessage((_payload: null, message) => {
    let result = 0;

    for (let i = 0; i < 100; i++) {
      result += i;

      message.reportProgress(i);
    }

    return result;
  }),

  asyncOperation: onMessage<null, number>().handle((message) => {
    asyncOperationState.asyncOperationWasCalled = true;

    let result = 1;

    const interval = setInterval(() => {
      result += 1;

      message.reportProgress(result);

      if (result >= 100) {
        asyncOperationState.didAsyncOperationFinish = true;
        clearInterval(interval);

        message.resolve(result);
      }
    }, 1000);

    message.onCancel(() => {
      asyncOperationState.didAsyncOperationCancel = true;

      clearInterval(interval);
    });
  }),

  getAsyncOperationState: () => asyncOperationState,

  setCount: (value: number) => {
    count = value;

    return count;
  },

  getCount: () => count,

  fastAsyncOperation: onMessage<null, number>().handle((message) => {
    const interval = setInterval(() => {
      // not necessary to clean up the interval here since the onCancel callback will be called
      if (!message.isPending()) return;

      count += 1;

      message.reportProgress(count);

      if (count >= 100) {
        clearInterval(interval);

        message.resolve(count);
      }
    }, 5);

    message.onCancel(() => {
      clearInterval(interval);
    });
  }),

  cancelTest: onMessage<null, void>().handle((message) => {
    setTimeout(() => {
      message.cancel('canceled from inside the worker');
    }, 1);
  }),

  getDidCallbackWasCalled: () => didCallbackWasCalled,

  sendOpenMessage: onMessage<SubscriptionKey, void>().handle((message) => {
    callbackKey = message.payload;
    previousMessage = message;

    message[callbackKey](() => {
      didCallbackWasCalled = true;
    });
  }),

  sendCloseMessage: () => {
    if (callbackKey === 'onProgress') {
      previousMessage?.reportProgress(1);
    }

    previousMessage?.[callbackKey === 'onCancel' ? 'cancel' : 'resolve']();
  },

  // the message is completed by the method itself to send the transferable objects
  transferArrayBuffer: onMessage((payload: TransferPayload, message) => {
    const { arrayBuffer, action } = payload;

    if (action === 'reportProgress') {
      message.reportProgress(50, payload, [arrayBuffer]);

      return;
    }

    message[action]({ arrayBuffer, action }, [arrayBuffer]);
  }),

  sum: async (values: number[]) => {
    await new Promise((resolve) => setTimeout(resolve, 1));

    return values.reduce((total, value) => total + value, 0);
  },

  fail: (reason: string): string => {
    throw new Error(reason);
  },

  failAsync: async (reason: string): Promise<string> => {
    throw new TypeError(reason);
  },
}));

// messages without a method, used by send, override and overrideAfterCurrent
unwrap(worker).onMessage((message) => {
  message.resolve();
});

export type TestWorker = typeof worker;
