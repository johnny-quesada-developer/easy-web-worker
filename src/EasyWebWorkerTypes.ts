import { CancelablePromise } from 'cancelable-promise-jq';

/**
 * This defines the structure of the onProgressCallback that you can use to receive the progress of the worker
 */
export type OnProgressCallback = (progressPercentage: number) => void;

/**
 * EasyWorker Config
 * */
export interface IWorkerConfig {
  /**
   **  External scripts that you want to include in your worker
   */
  scripts: string[];

  /**
   **  Identifier of your worker, this is in case you want to add a name to your worker file, otherwise an unique generic Id will be added as a name
   */
  name: string;
}

/**
 * This is the structure that the messages of the worker will have
 */
export interface IMessageData<IPayload = null> {
  /**
   * This are the parameters included in the message
   */
  payload: IPayload;

  /**
   * The messages from the worker could include errors if something went wrong
   * */
  reason: unknown;

  /**
   * Indicates if the message was canceled
   * */
  wasCanceled: boolean;

  /**
   * The messages from the worker could include a progress percentage
   * */
  progressPercentage: number;

  /**
   * This is the message id
   * */
  messageId: string;
}

export interface IEasyWorkerInstance<IPayload = null, IResult = void> {
  /**
   * Use this method to defined which will be the functionality of your worker when a message is send  to it
   * @param {function} callback - This is the callback that will be executed when a message is received
   * @param {IEasyWebWorkerMessage} callback.message - This is the message that was received
   * @param {IEasyWebWorkerMessage} callback.message.messageId - This is the message id
   * @param {IEasyWebWorkerMessage} callback.message.payload - This are the parameters included in the message
   * @param {IEasyWebWorkerMessage} callback.message.reject - This method is used to reject the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.reportProgress - This method is used to report the progress of the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.resolve - This method is used to resolve the message from inside the worker
   * @param {MessageEvent} callback.event - This is the event that was received
   * */
  onMessage(
    callback: (
      message: IEasyWebWorkerMessage<IPayload, IResult>,
      event: MessageEvent<IMessageData<IPayload>>
    ) => void
  ): void;
}

export interface IEasyWebWorkerMessage<IPayload = null, IResult = void> {
  /**
   * This is the message id
   */
  messageId: string;

  /**
   * This are the parameters included in the message
   * */
  payload: IPayload;

  /**
   * This method is used to reject the message from inside the worker
   * */
  reject: (reason?: unknown) => void;

  /**
   * This method is used to report the progress of the message from inside the worker
   * */
  reportProgress(progressPercentage: number): void;

  /**
   * This method is used to resolve the message from inside the worker
   * */
  resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;

  /**
   * This method is used to cancel the message from inside the worker
   * */
  cancel: (reason?: unknown) => void;
}

/**
 * This type defined the structure that a WorkerBody should have.
 * @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
 * @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
 * @param {IEasyWorkerInstance<IPayload, IResult>} easyWorker - ,
 */
export type EasyWebWorkerBody<IPayload = null, IResult = void> = (
  /**
   * This is the instance of the worker that you can use to communicate with the main thread
   */
  easyWorker: IEasyWorkerInstance<IPayload, IResult>,

  /**
   * This is the context of the worker, you can use it to access to the global scope of the worker
   * */
  context: any
) => void;

/**
 * The messages sent to the worker will return a promise that will be resolved when the worker completes the message
 * This is an special promise that allows to report progress and cancel the message if needed from the main thread
 */
export interface IMessagePromise<IResult = void>
  extends CancelablePromise<IResult> {
  /**
   * This method allows to report the progress of the message from the main thread in the onProgress callback
   * */
  onProgress: (callback: OnProgressCallback) => CancelablePromise<IResult>;
}
