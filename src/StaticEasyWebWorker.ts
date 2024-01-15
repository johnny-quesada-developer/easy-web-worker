import { Subscription } from "cancelable-promise-jq";
import {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
  TMessageCallback,
  TMessageCallbackType,
  TMessagePostType,
  TMessageStatus,
} from "./EasyWebWorker";

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
  $origin: string = ""
) {
  const { close, onMessage, importScripts } = ((_origin) => {
    const workerMessages = new Map<string, IEasyWebWorkerMessage>();

    /* This structure allows us to have multiple callbacks for the same worker */
    const workerCallbacks = new Map<
      string,
      (message: IEasyWebWorkerMessage, data: IMessageData) => void
    >([
      [
        "",
        () => {
          throw "you didn't defined a message-callback, please assign a callback by calling easyWorker.onMessage";
        },
      ],
    ]);

    const createMessage = ({
      messageId,
      payload,
      method,
      origin,
    }: {
      messageId: string;
      payload: TPayload;
      method: string;
      origin: string;
    }): IEasyWebWorkerMessage<any> => {
      let messageStatus: TMessageStatus = "pending";
      const messageCallbacks = new Map<
        TMessageCallbackType,
        Set<(messageData: IMessageData<any>, transfer: Transferable[]) => void>
      >();

      const postMessage = (
        messageType: TMessagePostType,
        messageData: IMessageData<any>,
        transfer: Transferable[] = []
      ) => {
        const currentMessageStatus = messageStatus;

        const targetMessageStatus: TMessageStatus =
          messageType === "progress" ? "pending" : messageType;

        if (!workerMessages.has(messageId)) {
          const message =
            "%c#" +
            messageId +
            " Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";

          console.error(
            message,
            "color: darkorange; font-size: 12px; font-weight: bold;",
            "font-weight: normal;",
            "font-weight: bold;",
            "font-weight: normal;",
            "color: lightblue; font-size: 10px; font-weight: bold;",
            "font-weight: bold; color: darkorange;",
            {
              messageId,
              status: {
                current: currentMessageStatus,
                target: targetMessageStatus,
              },
              method,
              action: messageData,
            }
          );

          return;
        }

        const callbacksKeys = {
          resolved: "onResolve",
          rejected: "onReject",
          /**
           * Cancelation could be triggered by the worker or by the main thread
           * */
          canceled: "onCancel",
          worker_cancelation: "onCancel",
          pending: "onProgress",
        }[targetMessageStatus] as TMessageCallbackType;

        const targetCallbacks = messageCallbacks.get(callbacksKeys);

        targetCallbacks?.forEach((callback) => callback(messageData, transfer));

        const isMessageTermination = !messageData.progress;

        if (isMessageTermination) {
          /**
           * If terminate the message, we also need to call the onFinalize callbacks if any
           */
          messageCallbacks
            .get("onFinalize")
            ?.forEach((callback) => callback(messageData, transfer));

          /* If it's not a progress message means that the message is resolved | rejected | canceled */
          workerMessages.delete(messageId);
        }

        self.postMessage({ messageId, ...messageData }, origin, transfer);

        messageStatus = targetMessageStatus;
      };

      const getStatus = (): TMessageStatus => messageStatus;

      const isPending = () => messageStatus === "pending";

      const resolve = ((result: TResult, transfer: Transferable[] = []) =>
        postMessage(
          "resolved",
          { resolved: { payload: result === undefined ? [] : [result] } },
          transfer
        )) as IEasyWebWorkerMessage["resolve"];

      const reject = ((reason: unknown, transfer: Transferable[] = []) => {
        postMessage("rejected", { rejected: { reason } }, transfer);
      }) as IEasyWebWorkerMessage["reject"];

      const cancel: IEasyWebWorkerMessage["cancel"] = (
        reason: unknown,
        transfer: Transferable[] = []
      ) =>
        postMessage(
          "worker_cancelation",
          { worker_cancelation: { reason } },
          transfer
        );

      const reportProgress = ((
        percentage: number,
        payload: unknown,
        transfer: Transferable[] = []
      ) => {
        postMessage(
          "progress",
          { progress: { percentage, payload } },
          transfer
        );
      }) as IEasyWebWorkerMessage["reportProgress"];

      const createSubscription =
        <TSubscriptionType extends TMessageCallbackType>(
          type: TSubscriptionType
        ) =>
        (callback: TMessageCallback): Subscription => {
          if (!messageCallbacks.has(type)) {
            messageCallbacks.set(type, new Set());
          }

          const callbacks = messageCallbacks.get(type);

          callbacks.add(callback);

          return () => callbacks.delete(callback);
        };

      return {
        messageId,
        method,
        payload,

        getStatus,
        isPending,

        /**
         * Actions
         */
        resolve,
        reject,
        cancel,
        reportProgress,

        /**
         * Callbacks
         */
        onResolve: createSubscription("onResolve"),
        onReject: createSubscription("onReject"),
        onCancel: createSubscription("onCancel"),
        onProgress: createSubscription("onProgress"),
        onFinalize: createSubscription("onFinalize"),
      };
    };

    const onMessage = (...args) => {
      const [param1, param2] = args;
      const hasCustomCallbackKey = typeof param1 === "string";

      if (hasCustomCallbackKey) {
        const callbackKey = param1;
        const callback = param2;

        workerCallbacks.set(callbackKey, callback);

        return;
      }

      const callback = param1;
      workerCallbacks.set("", callback);
    };

    const close = () => {
      /* should cancel all the promises of the main thread */
      const messages = [...workerMessages.values()];

      messages.forEach((message) => message.reject(new Error("worker closed")));

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

      const callback = workerCallbacks.get(method || "");

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
  targetOrigin: string = ""
) => {
  const worker = new StaticEasyWebWorker(onMessageCallback, targetOrigin);

  return worker;
};
