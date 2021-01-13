// eslint-disable-next-line max-classes-per-file
import * as IEasyWebWorker from './EasyWebWorkerTypes';

export const generatedId = (): string => `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`;

export const WorkerTemplate = (self: any): void => {

  const easyWorker = new (class implements IEasyWebWorker.IEasyWorkerInstance<any, any> {

    public onMessageCallback: (
      message: IEasyWebWorker.IEasyWebWorkerMessage<any>,
      event: MessageEvent<IEasyWebWorker.IMessageData<any>>
    ) => void = () => {
      // eslint-disable-next-line no-throw-literal
      throw 'you didnt defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage';
    };

    public onMessage = (callback: (
      message: IEasyWebWorker.IEasyWebWorkerMessage<any, any>,
      event: MessageEvent<IEasyWebWorker.IMessageData<any>>
    ) => void): void => {
      this.onMessageCallback = callback;
    };

  })();

  // eslint-disable-next-line no-param-reassign
  self.onmessage = (event: MessageEvent<any>) => {
    const { messageId, payload } = event.data;

    // each message should have his own resolution methods
    const message = new (class implements IEasyWebWorker.IEasyWebWorkerMessage<any, any> {

      payload: any = payload;

      messageId: string = messageId;

      public resolve = (...result: [null?] | [any]) => self.postMessage({ messageId, payload: result });

      public reject = (error: string | Error) => this.resolve({ error });

      public reportProgress = (progressPercentage: number) => self.postMessage({ messageId, progressPercentage });

    })();

    easyWorker.onMessageCallback(message, event);
  };
};

export default generatedId;
