import {
  IEasyWebWorkerMessage,
  IEasyWorkerInstance,
  IMessageData,
} from './EasyWebWorker';

/**
 * This message wrap the interaction with the worker to ensure that the message is correctly synchronized with the EasyWebWorker
 */
export class WorkerMessage<TPayload = null, TResult = void>
  implements IEasyWebWorkerMessage<TPayload, TResult>
{
  /**
   * @param {TPayload} payload - This are the parameters included in the message
   * @param {string} messageId - This is the message id
   * @param {string} messageTargetOrigin - This is the target origin of the message
   */
  constructor(
    public payload: TPayload,
    public messageId: string,
    protected messageTargetOrigin: string = '*'
  ) {}

  /**
   * This method is used to resolve the message from inside the worker
   */
  public resolve = ((...payload: unknown[]) => {
    const { messageId } = this;

    self.postMessage({ messageId, payload }, this.messageTargetOrigin);
  }) as TResult extends void ? () => void : (payload: TResult) => void;

  /**
   * This method is used to reject the message from inside the worker
   * */
  public reject(reason: unknown) {
    self.postMessage({ reason }, this.messageTargetOrigin);
  }

  /**
   * This method is used to cancel the message from inside the worker
   */
  public cancel(reason?: unknown) {
    self.postMessage({ wasCanceled: true, reason }, this.messageTargetOrigin);
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
export class StaticEasyWebWorker<TPayload = null, TResult = void>
  implements IEasyWorkerInstance<TPayload, TResult>
{
  constructor(
    public onMessageCallback: (
      message: IEasyWebWorkerMessage<TPayload, TResult>,
      event: MessageEvent<IMessageData<TPayload>>
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
      const message = new WorkerMessage<TPayload, TResult>(
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
      message: IEasyWebWorkerMessage<TPayload, TResult>,
      event: MessageEvent<IMessageData<TPayload>>
    ) => void
  ): void {
    this.onMessageCallback = callback;
  }
}
