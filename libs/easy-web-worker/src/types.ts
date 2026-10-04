export type Subscription = () => void;

/**
 * EasyWorker Config
 * */
export interface IWorkerConfig<TPrimitiveParameters extends any[] = unknown[]> {
  /**
   **  External scripts that you want to include in your worker
   */
  scripts: string[];

  /**
   **  Identifier of your worker, this is in case you want to add a name to your worker file, otherwise an unique generic Id will be added as a name
   */
  name: string;

  workerOptions: WorkerOptions;

  /**
   * Callback that will be executed when the worker fails, this not necessary affect the current message execution
   * */
  onWorkerError: (error: ErrorEvent) => void;

  /**
   * Maximum quantity of workers that will be created, default is 4
   */
  maxWorkers: number;
  /**
   * Indicates if the worker should be kept alive after the message is completed
   * otherwise, the workers will be terminated after a configured delay has passed and there is no messages in the queue
   */
  keepAlive: boolean;
  /**
   * Quantity of milliseconds to wait before terminating the worker if there is no messages in the queue
   */
  terminationDelay: number;

  /**
   * Indicates whenever the maximum quantity of workers should be created at the initialization of the easy web worker,
   * If warmUp is true keepAlive will be set to true
   */
  warmUpWorkers: boolean;

  /**
   * Allows to pass static primitive parameters to the worker
   */
  primitiveParameters?: TPrimitiveParameters;

  /**
   * @deprecated This url parameter don't have any effect on the worker, it will be removed in the next major version
   * To create a worker from an external file, you should pass the url as the first parameter of the EasyWebWorker constructor
   */
  url?: string;
}

export interface IWorkerData<IPayload> {
  /**
   * This is the message id
   * */
  readonly messageId: string;

  readonly __is_easy_web_worker_message__: boolean;

  readonly method?: string;

  readonly execution?: {
    payload?: IPayload;
  };

  readonly cancelation?: {
    reason?: unknown;
  };
}

/**
 * This is the structure that the messages of the worker will have
 */
export interface IMessageData<IPayload = null> {
  /**
   * This is the message id
   * */
  readonly messageId?: string;

  /**
   * When present, this means that the message was resolved
   */
  readonly resolved?: { payload: [IPayload?] };

  /**
   * When present, this means that the message was rejected
   * */
  readonly rejected?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  readonly canceled?: { reason: unknown };

  /**
   * When present, this means that the message was canceled from inside the worker
   * */
  readonly worker_cancelation?: { reason: unknown };

  /**
   * When present, this means that the should report the progress
   * */
  readonly progress?: {
    /**
     * This is the progress percentage
     * */
    percentage: number;
    /**
     * This extra data can be included in the progress
     * */
    payload: unknown;
  };
}

export interface IEasyWorkerInstance<TPayload = null, TResult = void> {
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
      message: IEasyWebWorkerMessage<TPayload, TResult>,
      event: MessageEvent<IMessageData<TPayload>>
    ) => void
  ): void;

  /**
   * Use this method to defined which will be the functionality of your worker when a message is send  to it
   * @param {string} method - Create a callback for an specific method
   * @param {function} callback - This is the callback that will be executed when a message is received
   * @param {IEasyWebWorkerMessage} callback.message - This is the message that was received
   * @param {IEasyWebWorkerMessage} callback.message.messageId - This is the message id
   * @param {IEasyWebWorkerMessage} callback.message.payload - This are the parameters included in the message
   * @param {IEasyWebWorkerMessage} callback.message.reject - This method is used to reject the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.reportProgress - This method is used to report the progress of the message from inside the worker
   * @param {IEasyWebWorkerMessage} callback.message.resolve - This method is used to resolve the message from inside the worker
   * @param {MessageEvent} callback.event - This is the event that was received
   * */
  onMessage<TPayload_ = null, TResult_ = void>(
    method: string,
    callback: (
      message: IEasyWebWorkerMessage<TPayload_, TResult_>,
      event: MessageEvent<IMessageData<TPayload_>>
    ) => void
  ): void;

  /**
   * Import scripts to the worker
   */
  importScripts(...scripts: string[]): void;

  /**
   * This method reject all the messages that are currently in the queue of the worker and close the worker
   * */
  close(): void;
}

export type TOverrideConfig = {
  /**
   * If true, the worker reboots and cancel instantly all the messages that are currently in the queue
   */
  force?: boolean;
};

/**
 * This type defined the structure that a WorkerBody should have.
 * @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
 * @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
 * @param {IEasyWorkerInstance<IPayload, IResult>} easyWorker - ,
 */
export type EasyWebWorkerBody<
  IPayload = null,
  IResult = void,
  TPrimitiveParameters extends any[] = unknown[]
> = (
  /**
   * This is the instance of the worker that you can use to communicate with the main thread
   */
  easyWorker: IEasyWorkerInstance<IPayload, IResult>,

  /**
   * This is the context of the worker, you can use it to access to the global scope of the worker
   * */
  context: DedicatedWorkerGlobalScope & {
    primitiveParameters: TPrimitiveParameters;
  } & Record<string, unknown>
) => void;

export type TMessagePostType =
  | 'progress'
  | 'resolved'
  | 'rejected'
  | 'canceled'
  | 'worker_cancelation';

export type TMessageCallback = (
  messageData: IMessageData<any>,
  transfer: Transferable[]
) => void;

export type TMessageCallbackType =
  | 'onResolve'
  | 'onCancel'
  | 'onReject'
  | 'onProgress'
  | 'onFinalize';

export type TMessageStatus = TMessagePostType | 'pending';

/**
 * This contract is just for the messages inside the workers
 */
export interface IEasyWebWorkerMessage<TPayload = null, TResult = void> {
  /**
   * This is the method name targeted by the message
   */
  method?: string;

  /**
   * This is the message id
   */
  readonly messageId: string;

  /**
   * This are the parameters included in the message
   * */
  readonly payload: TPayload;

  /**
   * This method is used to report the progress of the message from inside the worker
   * */
  readonly reportProgress: (
    percentage: number,
    payload?: unknown,
    transfer?: Transferable[]
  ) => void;

  /**
   * This method is used to resolve the message from inside the worker
   * */
  readonly resolve: [TResult] extends [void]
    ? () => void
    : (payload: TResult, transfer?: Transferable[]) => void;

  /**
   * This method is used to reject the message from inside the worker
   * */
  readonly reject: (reason?: unknown, transfer?: Transferable[]) => void;

  /**
   * This method is used to cancel the message from inside the worker
   * */
  readonly cancel: (reason?: unknown, transfer?: Transferable[]) => void;

  /**
   * Gets the current status of the message
   */
  readonly getStatus: () => TMessageStatus;

  /**
   * Returns true if the message is pending
   */
  readonly isPending: () => boolean;

  /**
   * This method is used to subscribe to the worker resolve event of the message
   */
  readonly onResolve: (callback: TMessageCallback) => Subscription;

  /**
   * This method is used to subscribe to the worker reject event of the message
   */
  readonly onReject: (callback: TMessageCallback) => Subscription;

  /**
   * This method is used to subscribe to the worker cancelation event of the message
   */
  readonly onCancel: (callback: TMessageCallback) => Subscription;

  /**
   * This method is used to subscribe to the worker onProgress event of the message
   */
  readonly onProgress: (callback: TMessageCallback) => Subscription;

  /**
   * This method is used to subscribe to the worker finally event of the message, once the message is resolved | rejected | canceled
   */
  readonly onFinalize: (callback: TMessageCallback) => Subscription;
}
