/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
export const dummyUrl = 'http://test.com';

export const createObjectURL = jest.fn(() => dummyUrl);

export class WorkerMock {
  public postMessage({
    messageId,
    payload,
  }: {
    messageId: string;
    payload: any;
  }) {}

  public onmessage({
    messageId,
    payload,
  }: {
    messageId: string;
    payload: any;
  }) {}

  public onerror() {}

  terminate() {}
}

export const MockBlob = jest.fn(
  (content: string[], config: { type: string }) => {}
);

// eslint-disable-next-line no-new-func
export const CreateMockFunctionFromContent = (content: string) =>
  new Function(`return ((self) => {${content}})(...arguments)`);

export const getMockBlobContent = () =>
  `self.importScripts(["fake.js"]);\n      \n// this code was auto-generated\n  const easyWorker = new (class {\n    onMessageCallback = () => {\n      // eslint-disable-next-line no-throw-literal\n      throw "you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage";\n    };\n\n    onMessage = (callback) => {\n      this.onMessageCallback = callback;\n    };\n  })();\n\n  self.onmessage = (event) => {\n    const { messageId, payload } = event.data;\n\n    // each message should have his own resolution methods\n    const message = new (class {\n      payload = payload;\n\n      messageId = messageId;\n\n      resolve = (...result) => self.postMessage({ messageId, payload: result });\n\n      reject = (error) => this.resolve({ error });\n\n      reportProgress = (progressPercentage) =>\n        self.postMessage({ messageId, progressPercentage });\n    })();\n\n    easyWorker.onMessageCallback(message, event);\n  };\n\n      // content #0\n((easyWorker, context) => {\n            context.globalPropertyTest = 'globalPropertyTest';\n            easyWorker.onMessage((message) => {\n                message.resolve();\n            });\n        })(easyWorker, self);`;

export default WorkerMock;
