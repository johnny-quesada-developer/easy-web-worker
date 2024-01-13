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
  $origin: string = ''
) {
  const { close, onMessage, importScripts } = ((_origin) => {
    const workerMessages = new Map();

    /* This structure allows us to have multiple callbacks for the same worker */
    const workerCallbacks = new Map<
      string,
      (message: IEasyWebWorkerMessage, data: IMessageData) => void
    >([
      [
        '',
        () => {
          throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
        },
      ],
    ]);

    const createMessage = ({
      messageId,
      payload,
      method,
      origin,
    }): IEasyWebWorkerMessage => {
      const cancelCallbacks = new Set<(reason: unknown) => void>();
      let messageStatus = 'pending';

      const postMessage = (data, transfer) => {
        const currentMessageStatus = messageStatus;

        const targetMessageStatus = (() => {
          if (data.resolved) return 'resolved';
          if (data.rejected) return 'rejected';
          if (data.worker_cancelation) return 'canceled';

          return messageStatus;
        })();

        if (!workerMessages.has(messageId)) {
          const message = "%c#" + messageId + " Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";

          console.error(
            message,
            'color: darkorange; font-size: 12px; font-weight: bold;',
            'font-weight: normal;',
            'font-weight: bold;',
            'font-weight: normal;',
            'color: lightblue; font-size: 10px; font-weight: bold;',
            'font-weight: bold; color: darkorange;',
            {
              messageId,
              status: {
                current: currentMessageStatus,
                target: targetMessageStatus,
              },
              method,
              action: data,
            }
          );

          return;
        }

        const { progress } = data;

        if (!progress) {
          /* If it's not a progress message means that the message is resolved | rejected | canceled */
          workerMessages.delete(messageId);
        }

        self.postMessage({ messageId, ...data }, origin, transfer);

        messageStatus = targetMessageStatus;
      };

      const getStatus = () =>
        messageStatus as 'pending' | 'resolved' | 'rejected' | 'canceled';

      const isPending = () => messageStatus === 'pending';

      const resolve = ((result, transfer) => {
        postMessage(
          { resolved: { payload: result === undefined ? [] : [result] } },
          transfer
        );
      }) as IEasyWebWorkerMessage['resolve'];

      const reject = (reason) => {
        postMessage({ rejected: { reason } }, []);
      };

      const cancel = (reason) => {
        const callbacks = [...cancelCallbacks];

        callbacks.forEach((callback) => callback(reason));

        postMessage({ worker_cancelation: { reason } }, []);
      };

      const reportProgress = (percentage, payload, transfer) => {
        postMessage({ progress: { percentage, payload } }, transfer);
      };

      /* Returns a function that can be used to unsubscribe from the cancelation */
      const onCancel = (callback) => {
        cancelCallbacks.add(callback);

        return () => cancelCallbacks.delete(callback);
      };

      return {
        messageId,
        getStatus,
        isPending,
        method,
        payload,
        resolve,
        reject,
        cancel,
        onCancel,
        reportProgress,
      };
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

      const { method, execution } = event.data;
      const { payload } = execution;

      const message = createMessage({
        method,
        messageId,
        payload,
        origin: _origin || origin || undefined,
      });

      workerMessages.set(messageId, message);

      const callback = workerCallbacks.get(method || '');

      callback(message, event);
    };

    const importScripts = (...scripts: string[]) => {
      self.importScripts(...scripts);
    };

    return {
      onMessage,
      close,
      importScripts,
    };
  })($origin);

  this.close = close;
  this.onMessage = onMessage;
  this.importScripts = importScripts;

  if (onMessageCallback) {
    onMessage(onMessageCallback);
  }
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
