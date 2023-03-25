import {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
} from './EasyWebWorkerTypes';

/**
 * This message wrap the interaction with the worker to ensure that the message is correctly synchronized with the EasyWebWorker
 */
export class WorkerMessage<IPayload = null, IResult = void>
  implements IEasyWebWorkerMessage<IPayload, IResult>
{
  /**
   * @param {IPayload} payload - This are the parameters included in the message
   * @param {string} messageId - This is the message id
   * @param {string} messageTargetOrigin - This is the target origin of the message
   */
  constructor(
    public payload: IPayload,
    public messageId: string,
    protected messageTargetOrigin: string = '*'
  ) {}

  /**
   * This method is used to resolve the message from inside the worker
   */
  public resolve(...payload: [null?] | [any]) {
    const { messageId } = this;

    self.postMessage({ messageId, payload }, this.messageTargetOrigin);
  }

  /**
   * This method is used to reject the message from inside the worker
   * */
  public reject(reason: unknown) {
    this.resolve({ error: reason });
  }

  /**
   * This method is used to cancel the message from inside the worker
   */
  public cancel(reason?: unknown) {
    this.resolve({ cancelled: true, error: reason });
  }

  /**
   * This method is used to report the progress of the message from inside the worker
   * */
  public reportProgress(progressPercentage: number) {
    const { messageId } = this;

    self.postMessage(
      { messageId, progressPercentage },
      this.messageTargetOrigin
    );
  }
}

/**
 * This class is used to create a static worker
 * @param {function} onMessageCallback - This is the callback that will be executed when a message is received
 * @param {IEasyWebWorkerMessage} onMessageCallback.message - This is the message that was received
 * @param {IEasyWebWorkerMessage} onMessageCallback.message.messageId - This is the message id
 * @param {IEasyWebWorkerMessage} onMessageCallback.message.payload - This are the parameters included in the message
 * @param {IEasyWebWorkerMessage} onMessageCallback.message.reject - This method is used to reject the message from inside the worker
 * @param {IEasyWebWorkerMessage} onMessageCallback.message.reportProgress - This method is used to report the progress of the message from inside the worker
 * @param {IEasyWebWorkerMessage} onMessageCallback.message.resolve - This method is used to resolve the message from inside the worker
 * @param {MessageEvent} onMessageCallback.event - This is the event that was received
 * @param {string} messageTargetOrigin - This is the target origin of the message
 */
export class StaticEasyWebWorker<IPayload = null, IResult = void>
  implements IEasyWorkerInstance<IPayload, IResult>
{
  constructor(
    public onMessageCallback: (
      message: IEasyWebWorkerMessage<IPayload, IResult>,
      event: MessageEvent<IMessageData<IPayload>>
    ) => void,
    messageTargetOrigin: string = '*'
  ) {
    this.defineOnMessage(messageTargetOrigin);
  }

  /**
   * This method is used to define the onMessage callback
   * @param {string} messageTargetOrigin - This is the target origin of the message
   * */
  public defineOnMessage(messageTargetOrigin: string): void {
    self.onmessage = (event: MessageEvent<any>) => {
      const { messageId, payload } = event.data;

      // each message should have his own resolution methods
      const message = new WorkerMessage<IPayload, IResult>(
        payload,
        messageId,
        messageTargetOrigin
      );

      this.onMessageCallback.call(this, message, event);
    };
  }

  /**
   * This method is used to define the onMessage callback
   * @param {function} callback - This is the callback that will be executed when a message is received
   * @param {IEasyWebWorkerMessage} callback.message - This is the message that was received
   * @param {IEasyWebWorkerMessage} callback.message.messageId - This is the message id
   * @param {IEasyWebWorkerMessage} callback.message.payload - This are the parameters included in the message
   * @param {IEasyWebWorkerMessage} callback.message.reject - This method is used to reject the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.reportProgress - This method is used to report the progress of the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.resolve - This method is used to resolve the message from inside the worker
   * @param {MessageEvent} callback.event - This is the event that was received
   */
  public onMessage(
    callback: (
      message: IEasyWebWorkerMessage<IPayload, IResult>,
      event: MessageEvent<IMessageData<IPayload>>
    ) => void
  ): void {
    this.onMessageCallback = callback;
  }
}
