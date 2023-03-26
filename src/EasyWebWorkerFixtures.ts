export const generatedId = (): string =>
  `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`;

/**
 * This is the template of the worker, should be and string to avoid compilation issues
 */
export const WorkerTemplate = () => `
  //this-code-was auto-generated
  const easyWorker = new (class {
    onMessageCallback = () => {
      throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
    };

    onMessage = (callback) => {
      this.onMessageCallback = callback;
    };
  })();

  self.onmessage = (event) => {
    const { messageId, payload } = event.data;

    // each message should have his own resolution methods
    const message = new (class {
      payload = payload;

      messageId = messageId;

      resolve = (...result) => self.postMessage({ messageId, payload: result });

      reject = (reason) => self.postMessage({ messageId, reason });

      cancel = (reason) => self.postMessage({  messageId, reason, wasCanceled: true });

      reportProgress = (progressPercentage) => self.postMessage({ messageId, progressPercentage });
    })();

    easyWorker.onMessageCallback(message, event);
  };
`;
