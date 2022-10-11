// eslint-disable-next-line max-classes-per-file
import * as IEasyWebWorker from "./EasyWebWorkerTypes";

export const generatedId = (): string =>
  `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`;

export const WorkerTemplate = () => `
// this code was auto-generated
  const easyWorker = new (class {
    onMessageCallback = () => {
      // eslint-disable-next-line no-throw-literal
      throw "you didnt defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";
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

      reject = (error) => this.resolve({ error });

      reportProgress = (progressPercentage) =>
        self.postMessage({ messageId, progressPercentage });
    })();

    easyWorker.onMessageCallback(message, event);
  };
`;

export default generatedId;
