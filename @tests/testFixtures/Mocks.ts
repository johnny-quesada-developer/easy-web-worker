export const dummyUrl = 'http://test.com';

export const createObjectURL = () => dummyUrl;

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

  public terminate() {}
}

export const MockBlob = jest.fn(
  (content: string[], config: { type: string }) => {}
);

export const CreateMockFunctionFromContent = (content: string) =>
  new Function(`return ((self) => {${content}})(...arguments)`);

export const getMockBlobContent = () => `
self.importScripts(['fake.js']);
      
//this-code-was auto-generated

const easyWorker = new (class {
  onMessageCallback = () => {
    throw 'you didn't defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage';
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
      
      resolve = (...payload) => self.postMessage({ messageId, payload });
      
      reject = (reason) => this.resolve({ reason });

      cancel = (reason) => this.resolve({ reason, wasCanceled: true });
      
      reportProgress = (progressPercentage) => self.postMessage({ messageId, progressPercentage });
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
