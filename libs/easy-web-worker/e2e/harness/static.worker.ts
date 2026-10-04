import { createStaticEasyWebWorker } from 'easy-web-worker';

/**
 * Worker file used by the specs, each method covers one behavior of the static worker.
 */
const scope = self as any;

const state = {
  counter: 0,
  canceled: 0,
  finalized: 0,
};

const worker = createStaticEasyWebWorker<string, string>((message) => {
  message.resolve(`Hello ${message.payload}!`);
});

worker.onMessage<null, string>('name', (message) => {
  message.resolve(scope.name);
});

worker.onMessage<null, number>('increment', (message) => {
  state.counter += 1;

  message.resolve(state.counter);
});

worker.onMessage<null, typeof state>('getState', (message) => {
  message.resolve({ ...state });
});

worker.onMessage<number, number>('progress', (message) => {
  for (let step = 1; step <= message.payload; step++) {
    message.reportProgress((step * 100) / message.payload, step);
  }

  message.resolve(message.payload);
});

worker.onMessage<number, string>('slow', (message) => {
  const timeoutId = setTimeout(() => message.resolve('done'), message.payload);

  message.onCancel(() => {
    state.canceled += 1;

    clearTimeout(timeoutId);
  });

  message.onFinalize(() => {
    state.finalized += 1;
  });
});

worker.onMessage<string, void>('reject', (message) => {
  message.reject(message.payload);
});

worker.onMessage<null, void>('rejectWithError', (message) => {
  message.reject(new TypeError('worker type error'));
});

worker.onMessage<string, void>('cancelFromWorker', (message) => {
  message.cancel(message.payload);
});

worker.onMessage<null, string>('completeTwice', (message) => {
  message.resolve('first');
  message.resolve('second');
  message.reject('third');
  message.reportProgress(50);
});

worker.onMessage<ArrayBuffer, { received: number; buffer: ArrayBuffer }>(
  'transfer',
  (message) => {
    const { payload } = message;
    const buffer = new ArrayBuffer(payload.byteLength * 2);

    message.resolve({ received: payload.byteLength, buffer }, [buffer]);
  }
);

worker.onMessage<null, void>('postRawMessages', (message) => {
  // not EasyWebWorker messages, the main thread should ignore them
  scope.postMessage('raw message');
  scope.postMessage({ messageId: 'unknown message' });

  message.resolve();
});

worker.onMessage<string, number>('importScripts', (message) => {
  worker.importScripts(message.payload);

  message.resolve(scope.add(2, 3));
});

worker.onMessage<null, void>('throw', () => {
  throw new Error('worker callback error');
});

worker.onMessage<null, void>('close', () => {
  worker.close();
});
