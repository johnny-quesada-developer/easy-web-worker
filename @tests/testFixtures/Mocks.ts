/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-classes-per-file */
export const dummyUrl = 'http://test.com';

export const createObjectURL = jest.fn(() => dummyUrl);

export class WorkerMock {

  public postMessage({
    messageId,
    payload,
  }: { messageId: string, payload: any }) {}

  public onmessage({
    messageId,
    payload,
  }: { messageId: string, payload: any }) {}

  public onerror() {}

}

export const MockBlob = jest.fn((content: string[], config: { type: string }) => {});

// eslint-disable-next-line no-new-func
export const CreateMockFunctionFromContent = (content: string) => new Function(`return ((self) => {${content}})(...arguments)`);

export const getMockBlobContent = () => `self.importScripts(["fake.js"]);
      
const easyWorker = new (class {
    constructor() {
        this.onMessageCallback = () => {
            // eslint-disable-next-line no-throw-literal
            throw 'you didnt defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage';
        };
        this.onMessage = (callback) => {
            this.onMessageCallback = callback;
        };
    }
})();
// eslint-disable-next-line no-param-reassign
self.onmessage = (event) => {
    const { messageId, payload } = event.data;
    // each message should have his own resolution methods
    const message = new (class {
        constructor() {
            this.payload = payload;
            this.messageId = messageId;
            this.resolve = (...result) => self.postMessage({ messageId, payload: result });
            this.reject = (error) => this.resolve({ error });
            this.reportProgress = (progressPercentage) => self.postMessage({ messageId, progressPercentage });
        }
    })();
    easyWorker.onMessageCallback(message, event);
};

  // content #0
((easyWorker, context) => {
        context.globalPropertyTest = 'globalPropertyTest';
        easyWorker.onMessage((message) => {
            message.resolve();
        });
    })(easyWorker, self);`;

export default WorkerMock;
