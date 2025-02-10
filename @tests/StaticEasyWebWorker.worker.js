'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const { parentPort, isMainThread, workerData } = require('node:worker_threads');

const { URL_MOCK, BLOB_MOCK, WINDOW_MOCK } = require(path.resolve(
  __dirname,
  './fixtures.js'
));

/**
 * Mocking environment for static easy web worker
 */
(() => {
  globalThis.window = WINDOW_MOCK;
  globalThis.Blob = BLOB_MOCK;
  globalThis.window.URL = URL_MOCK;

  globalThis.parentPort = parentPort;
  globalThis.isMainThread = isMainThread;
  globalThis.workerData = workerData;

  // self mock
  globalThis.self = {
    importScripts: () => {},
    close: parentPort.close,
    postMessage: (data, transfer) => {
      parentPort?.postMessage(
        {
          data,
        },
        transfer
      );
    },
    onmessage: null,
    onerror: null,
  };

  parentPort.on('message', (message) => {
    self.onmessage?.(message);
  });

  parentPort.on('error', (error) => {
    self.onerror?.(error);
  });
})();

const easyWebWorkers = require(path.resolve(__dirname, '../bundle.js'));
const { createStaticEasyWebWorker } = easyWebWorkers;

const worker = createStaticEasyWebWorker((message) => {
  const result = 'Hello from StaticEasyWebWorker!';

  message.resolve(result);
});

worker.onMessage('actionWithPayload', (message) => {
  const result = `Hello ${message.payload}!`;

  message.resolve(result);
});

worker.onMessage('progressTest', (message) => {
  let result = 0;

  for (let i = 0; i < 100; i++) {
    result += i;

    message.reportProgress(i);
  }

  message.resolve(result);
});

let asyncOperationState = {
  asyncOperationWasCalled: false,
  didAsyncOperationFinish: false,
  didAsyncOperationCancel: false,
};

worker.onMessage('asyncOperation', (message) => {
  try {
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
  } catch (error) {
    message.reject(error);
  }
});

worker.onMessage('getAsyncOperationState', (message) => {
  message.resolve(asyncOperationState);
});

let count = 0;

worker.onMessage('setCount', (message) => {
  count = message.payload;

  message.resolve(count);
});

worker.onMessage('getCount', (message) => {
  message.resolve(count);
});

worker.onMessage('fastAsyncOperation', (message) => {
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
});

worker.onMessage('cancelTest', (message) => {
  setTimeout(() => {
    message.cancel('canceled from inside the worker');
  }, 1);
});

let previousMessage = null;
let didCallbackWasCalled = false;
let callbackKey = null;

worker.onMessage('getDidCallbackWasCalled', (message) => {
  message.resolve(didCallbackWasCalled);
});

worker.onMessage('sendOpenMessage', (message) => {
  const { payload } = message;

  callbackKey = payload;

  previousMessage = message;

  message[callbackKey](() => {
    didCallbackWasCalled = true;
  });
});

worker.onMessage('sendCloseMessage', (message) => {
  if (callbackKey === 'onProgress') {
    previousMessage?.reportProgress(1);
  }

  previousMessage?.[callbackKey === 'onCancel' ? 'cancel' : 'resolve']();

  message.resolve();
});

worker.onMessage('transferArrayBuffer', (message) => {
  const { arrayBuffer, action } = message.payload;

  if (action === 'reportProgress') {
    message.reportProgress(50, message.payload, [arrayBuffer]);

    message.resolve(arrayBuffer.byteLength);

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
