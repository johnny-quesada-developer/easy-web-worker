import {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
} from './EasyWebWorker';

/**
 * Constructor for the StaticEasyWebWorker
 * @param onMessageCallback - callback to be called when a message is received
 * @param targetOrigin - the target origin to be used when sending messages
 * @returns an instance of the StaticEasyWebWorker
 * */
export const StaticEasyWebWorker = function <TPayload = null, TResult = void>(
  this: IEasyWorkerInstance,
  onMessageCallback?: (
    message: IEasyWebWorkerMessage<TPayload, TResult>,
    event: MessageEvent<IMessageData<TPayload>>
  ) => void,
  targetOrigin: string = ''
) {
  const createMessage = ({ messageId, payload, origin }) => {
    const cancelCallbacks = new Set<(reason) => void>();

    const postMessage = (data) => {
      const { progress } = data;

      if (!progress) {
        /* If it's not a progress message means that the message is resolved | rejected | canceled */
        workerMessages.delete(messageId);
      }

      self.postMessage({ messageId, ...data }, origin);
    };

    const resolve = function () {
      const result = Array.from(arguments);

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

    /* Returns a function that can be used to unsubscribe from the cancelation */
    const onCancel = (callback) => {
      cancelCallbacks.add(callback);

      return () => cancelCallbacks.delete(callback);
    };

    const reportProgress = (percentage, payload) => {
      postMessage({ progress: { percentage, payload } });
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

  /**
   * This is the map that contains all the messages that are being processed by the worker
   */
  const workerMessages = new Map<
    string,
    IEasyWebWorkerMessage<TPayload, TResult>
  >();

  /**
   * This is the map that contains all the callbacks that are being processed by the worker
   * */
  const workerCallbacks = new Map<string, (...args) => void>([
    [
      '',
      () => {
        throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
      },
    ],
  ]);

  const importScripts = (...scripts: string[]) => {
    // @ts-ignore
    self.importScripts(...scripts);
  };

  const close = () => {
    /* should cancel all the promises of the main thread before closing the worker */
    const messages = [...workerMessages.values()];

    messages.forEach((message) => message.reject(new Error('worker closed')));

    self.close();
  };

  /**
   * This method is used to define the onMessage callback
   * @param {string} callbackKey - This is the key of the callback
   * @param {function} callback - This is the callback that will be executed when a message is received
   * @param {IEasyWebWorkerMessage} callback.message - This is the message that was received
   * @param {IEasyWebWorkerMessage} callback.message.messageId - This is the message id
   * @param {IEasyWebWorkerMessage} callback.message.payload - This are the parameters included in the message
   * @param {IEasyWebWorkerMessage} callback.message.reject - This method is used to reject the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.reportProgress - This method is used to report the progress of the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.resolve - This method is used to resolve the message from inside the worker
   * @param {MessageEvent} callback.event - This is the event that was received
   */
  const onMessage = (...args: unknown[]): void => {
    const [param1, param2] = args;
    const hasCustomCallbackKey = typeof param1 === 'string';

    if (hasCustomCallbackKey) {
      const callbackKey = param1;
      const callback = param2 as (...args: unknown[]) => void;

      workerCallbacks.set(callbackKey, callback);

      return;
    }

    const callback = param1;
    workerCallbacks.set('', callback as (...args: unknown[]) => void);
  };

  /**
   * This is the onMessage callback that will be executed when a message is received
   */
  self.onmessage = (event: MessageEvent<any>) => {
    const { data, origin } = event;
    const { messageId, cancelation } = data;

    if (cancelation) {
      const { reason } = cancelation;

      const message = workerMessages.get(messageId);

      message.cancel(reason);

      return;
    }

    const { method, execution } = event.data;
    const { payload } = execution;

    const message = createMessage({
      messageId,
      payload,
      origin: targetOrigin || origin || undefined,
    });

    const callback = workerCallbacks.get(method || '');

    callback(message, event);
  };

  if (onMessageCallback) {
    onMessage(onMessageCallback);
  }

  this.importScripts = importScripts;

  // @ts-ignore
  this.close = close;

  // @ts-ignore
  this.onMessage = onMessage;
} as unknown as new <TPayload = null, TResult = null>(
  onMessageCallback?: (
    message: IEasyWebWorkerMessage<TPayload, TResult>,
    event: MessageEvent<IMessageData<TPayload>>
  ) => void,
  targetOrigin?: string
) => IEasyWorkerInstance<TPayload, TResult>;

/**
 * This method is used to create a new instance of the easy static web worker
 */
export const createStaticEasyWebWorker = <TPayload = null, TResult = void>(
  onMessageCallback?: (
    message: IEasyWebWorkerMessage<TPayload, TResult>,
    event: MessageEvent<IMessageData<TPayload>>
  ) => void,
  targetOrigin: string = ''
) => {
  const worker = new StaticEasyWebWorker(onMessageCallback, targetOrigin);

  return worker;
};
