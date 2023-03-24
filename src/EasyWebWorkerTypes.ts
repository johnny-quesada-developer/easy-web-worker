export type OnProgressCallback = (progressPercentage: number) => void;

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

export interface IMessageData<IPayload = null> {
  payload: IPayload;
  error: unknown;
  progressPercentage: number;
  messageId: string;
}

export interface IEasyWorkerInstance<IPayload = null, IResult = void> {
  /**
  * Use this method to defined which will be the functionality of your worker when a message is send  to it
  * @param {(message: IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IMessageData<IPayload>>) => void} callback - current message
  // * @returns {void}
  * */
  onMessage(
    callback: (
      message: IEasyWebWorkerMessage<IPayload, IResult>,
      event: MessageEvent<IMessageData<IPayload>>
    ) => void
  ): void;
}

export interface IEasyWebWorkerMessage<IPayload = null, IResult = void> {
  messageId: string;

  payload: IPayload;

  reject: (reason: Error) => void;

  reportProgress(progressPercentage: number): void;

  resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
}

/**
 * This type defined the structure that a WorkerBody should have.
 * @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
 * @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
 * @param {IEasyWorkerInstance<IPayload, IResult>} easyWorker - ,
 */
export type EasyWebWorkerBody<IPayload = null, IResult = void> = (
  easyWorker: IEasyWorkerInstance<IPayload, IResult>,
  context: any
) => void;

export interface IMessagePromise<IResult = void> extends Promise<IResult> {
  onProgress: (callback: OnProgressCallback) => Promise<IResult>;
}
