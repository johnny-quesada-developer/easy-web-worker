"use strict";
(() => {
  // src/StaticEasyWebWorker.ts
  var StaticEasyWebWorker = function(onMessageCallback) {
    const { close, onMessage, importScripts } = (() => {
      const workerMessages = /* @__PURE__ */ new Map();
      const workerCallbacks = /* @__PURE__ */ new Map([
        [
          "",
          () => {
            throw "you didn't defined a message-callback, please assign a callback by calling easyWorker.onMessage";
          }
        ]
      ]);
      const createMessage = ({
        messageId,
        payload,
        method
      }) => {
        let messageStatus = "pending";
        const messageCallbacks = /* @__PURE__ */ new Map();
        const postMessage = (messageType, messageData, transfer = []) => {
          const currentMessageStatus = messageStatus;
          const targetMessageStatus = messageType === "progress" ? "pending" : messageType;
          if (!workerMessages.has(messageId)) {
            const message = "%c#" + messageId + " Message Not Found: %cThis means that the message was already resolved | rejected | canceled. To avoid this error, please make sure that you are not resolving | rejecting | canceling the same message twice. Also make sure that you are not reporting progress after the message was processed. Remember each message can handle his one cancelation by adding a handler with the %cmessage.onCancel%c method. To now more about this method, please check the documentation at: %chttps://www.npmjs.com/package/easy-web-worker#ieasywebworkermessageipayload--null-iresult--void %cTrying to process message:";
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
                  target: targetMessageStatus
                },
                method,
                action: messageData
              }
            );
            return;
          }
          const callbacksKey = {
            resolved: "onResolve",
            rejected: "onReject",
            /**
             * Cancelation could be triggered by the worker or by the main thread
             * */
            canceled: "onCancel",
            worker_cancelation: "onCancel",
            pending: "onProgress"
          }[targetMessageStatus];
          const targetCallbacks = messageCallbacks.get(callbacksKey);
          const isMessageTermination = !messageData.progress;
          try {
            targetCallbacks?.forEach(
              (callback) => callback(messageData, transfer)
            );
            if (isMessageTermination) {
              messageCallbacks.get("onFinalize")?.forEach((callback) => callback(messageData, transfer));
            }
          } catch (error) {
            workerMessages.delete(messageId);
            throw {
              message: "Error while processing message id: " + messageId,
              error,
              messageData,
              messageType,
              when: callbacksKey
            };
          } finally {
            if (isMessageTermination) {
              workerMessages.delete(messageId);
            }
          }
          self.postMessage({ messageId, ...messageData }, transfer);
          messageStatus = targetMessageStatus;
        };
        const getStatus = () => messageStatus;
        const isPending = () => messageStatus === "pending";
        const resolve = (result, transfer = []) => postMessage(
          "resolved",
          { resolved: { payload: result === void 0 ? [] : [result] } },
          transfer
        );
        const reject = (reason, transfer = []) => {
          postMessage("rejected", { rejected: { reason } }, transfer);
        };
        const cancel = (reason, transfer = []) => postMessage(
          "worker_cancelation",
          { worker_cancelation: { reason } },
          transfer
        );
        const reportProgress = (percentage, payload2, transfer = []) => {
          postMessage(
            "progress",
            { progress: { percentage, payload: payload2 } },
            transfer
          );
        };
        const createSubscription = (type) => (callback) => {
          if (!messageCallbacks.has(type)) {
            messageCallbacks.set(type, /* @__PURE__ */ new Set());
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
          onFinalize: createSubscription("onFinalize")
        };
      };
      const onMessage2 = (...args) => {
        const [param1, param2] = args;
        const hasCustomCallbackKey = typeof param1 === "string";
        if (hasCustomCallbackKey) {
          const callbackKey = param1;
          const callback2 = param2;
          workerCallbacks.set(callbackKey, callback2);
          return;
        }
        const callback = param1;
        workerCallbacks.set("", callback);
      };
      const close2 = () => {
        const messages = [...workerMessages.values()];
        messages.forEach((message) => message.reject(new Error("worker closed")));
        self.close();
      };
      self.onmessage = (event) => {
        const messageId = event?.data?.messageId;
        const __is_easy_web_worker_message__ = event?.data?.__is_easy_web_worker_message__ ?? false;
        const isEasyWebWorkerMessage = messageId && __is_easy_web_worker_message__;
        if (!isEasyWebWorkerMessage) return;
        try {
          const { data } = event;
          const { cancelation } = data;
          if (cancelation) {
            const { reason } = cancelation;
            const message2 = workerMessages.get(messageId);
            message2?.cancel(reason);
            return;
          }
          const { method, execution } = event.data;
          const { payload } = execution;
          const message = createMessage({
            method,
            messageId,
            payload
          });
          workerMessages.set(messageId, message);
          const callback = workerCallbacks.get(method || "");
          callback(message, event);
        } catch (error) {
          workerMessages.delete(event.data?.messageId);
          throw {
            message: "Error while processing message id: " + messageId,
            event
          };
        }
      };
      const importScripts2 = (...scripts) => {
        self.importScripts(...scripts);
      };
      return {
        onMessage: onMessage2,
        close: close2,
        importScripts: importScripts2
      };
    })();
    this.close = close;
    this.onMessage = onMessage;
    this.importScripts = importScripts;
    if (onMessageCallback) {
      onMessage(onMessageCallback);
    }
  };

  // src/createStaticEasyWebWorker.ts
  var createStaticEasyWebWorker = (onMessageCallback) => {
    const worker2 = new StaticEasyWebWorker(onMessageCallback);
    return worker2;
  };

  // e2e/harness/static.worker.ts
  var scope = self;
  var state = {
    counter: 0,
    canceled: 0,
    finalized: 0
  };
  var worker = createStaticEasyWebWorker((message) => {
    message.resolve(`Hello ${message.payload}!`);
  });
  worker.onMessage("name", (message) => {
    message.resolve(scope.name);
  });
  worker.onMessage("increment", (message) => {
    state.counter += 1;
    message.resolve(state.counter);
  });
  worker.onMessage("getState", (message) => {
    message.resolve({ ...state });
  });
  worker.onMessage("progress", (message) => {
    for (let step = 1; step <= message.payload; step++) {
      message.reportProgress(step * 100 / message.payload, step);
    }
    message.resolve(message.payload);
  });
  worker.onMessage("slow", (message) => {
    const timeoutId = setTimeout(() => message.resolve("done"), message.payload);
    message.onCancel(() => {
      state.canceled += 1;
      clearTimeout(timeoutId);
    });
    message.onFinalize(() => {
      state.finalized += 1;
    });
  });
  worker.onMessage("reject", (message) => {
    message.reject(message.payload);
  });
  worker.onMessage("rejectWithError", (message) => {
    message.reject(new TypeError("worker type error"));
  });
  worker.onMessage("cancelFromWorker", (message) => {
    message.cancel(message.payload);
  });
  worker.onMessage("completeTwice", (message) => {
    message.resolve("first");
    message.resolve("second");
    message.reject("third");
    message.reportProgress(50);
  });
  worker.onMessage(
    "transfer",
    (message) => {
      const { payload } = message;
      const buffer = new ArrayBuffer(payload.byteLength * 2);
      message.resolve({ received: payload.byteLength, buffer }, [buffer]);
    }
  );
  worker.onMessage("postRawMessages", (message) => {
    scope.postMessage("raw message");
    scope.postMessage({ messageId: "unknown message" });
    message.resolve();
  });
  worker.onMessage("importScripts", (message) => {
    worker.importScripts(message.payload);
    message.resolve(scope.add(2, 3));
  });
  worker.onMessage("throw", () => {
    throw new Error("worker callback error");
  });
  worker.onMessage("close", () => {
    worker.close();
  });
})();
