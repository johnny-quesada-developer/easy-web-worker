/*this-code-was auto-generated*/
const createEasyWebWorker = (targetOrigin) => {
  /* Keep track of the messages sent allowing us to cancel them */
  const workerMessages = new Map();

  /* This structure allows us to have multiple callbacks for the same worker */
  const workerCallbacks = new Map([
    [
      '',
      () => {
        throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
      },
    ],
  ]);

  const createMessage = ({ messageId, payload, origin }) => {
    const cancelCallbacks = new Set();

    const postMessage = (data) => {
      const { progress } = data;

      if (!progress) {
        /* If it's not a progress message means that the message is resolved | rejected | canceled */
        workerMessages.delete(messageId);
      }

      self.postMessage({ messageId, ...data }, origin);
    };

    const resolve = (...result) => {
      postMessage({ resolved: { payload: result } });
    };

    const reject = (reason) => {
      postMessage({ rejected: { reason } });
    };

    const cancel = (reason) => {
      const callbacks = [...cancelCallbacks];

      callbacks.forEach((callback) => callback(reason));

      postMessage({ canceled: { reason } });
    };

    const reportProgress = (percentage, payload) => {
      postMessage({ progress: { percentage, payload } });
    };

    /* Returns a function that can be used to unsubscribe from the cancelation */
    const onCancel = (callback) => {
      cancelCallbacks.add(callback);

      return () => cancelCallbacks.delete(callback);
    };

    return {
      payload,
      resolve,
      reject,
      cancel,
      onCancel,
      reportProgress,
    };
  };

  const importScripts = (...scripts) => {
    self.importScripts(...scripts);
  };

  const onMessage = (...args) => {
    const [param1, param2] = args;
    const hasCustomCallbackKey = typeof param1 === 'string';

    if (hasCustomCallbackKey) {
      const callbackKey = param1;
      const callback = param2;

      workerCallbacks.set(callbackKey, callback);

      return;
    }

    const callback = param1;
    workerCallbacks.set('', callback);
  };

  const close = () => {
    /* should cancel all the promises of the main thread */
    const messages = [...workerMessages.values()];

    messages.forEach((message) => message.reject(new Error('worker closed')));

    self.close();
  };

  self.onmessage = (event) => {
    const { data, origin } = event;
    const { messageId, cancelation } = data;

    if (cancelation) {
      const { reason } = cancelation;

      const message = workerMessages.get(messageId);

      message.cancel(reason);

      return;
    }

    const { method, execution } = data;
    const { payload } = execution;

    const message = createMessage({
      messageId,
      payload,
      origin: targetOrigin || origin || '*',
    });

    workerMessages.set(messageId, message);

    const callback = workerCallbacks.get(method || '');

    callback(message, event);
  };

  return {
    importScripts,
    onMessage,
    close,
  };
};
