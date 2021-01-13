/* eslint-disable no-restricted-globals */
// eslint-disable-next-line max-classes-per-file
import * as IEasyWebWorker from './EasyWebWorkerTypes';

export class WorkerMessage<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult> {

  constructor(public payload: IPayload, public messageId: string, protected messageTargetOrigin: string = '*') {}

  public resolve(...result: [null?] | [any]) {
    self.postMessage({ messageId: this.messageId, payload: result }, this.messageTargetOrigin);
  }

  public reject(error: string | Error) {
    this.resolve({ error });
  }

  public reportProgress(progressPercentage: number) {
    self.postMessage({ messageId: this.messageId, progressPercentage }, this.messageTargetOrigin);
  }

}

export class StaticEasyWebWorker<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWorkerInstance<IPayload, IResult> {

  constructor(public onMessageCallback: (
    message: IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult>,
    event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>
  ) => void, messageTargetOrigin: string = '*') {
    this.defineOnMessage(messageTargetOrigin);
  }

  public defineOnMessage(messageTargetOrigin: string): void {
    self.onmessage = (event: MessageEvent<any>) => {
      const { messageId, payload } = event.data;

      // each message should have his own resolution methods
      const message = new WorkerMessage<IPayload, IResult>(payload, messageId, messageTargetOrigin);

      this.onMessageCallback.call(this, message, event);
    };
  }

  public onMessage(callback: (
    message: IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult>,
    event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>
  ) => void): void {
    this.onMessageCallback = callback;
  };

}

export default StaticEasyWebWorker;
