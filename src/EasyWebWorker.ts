import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import { WorkerTemplate, generatedId } from './EasyWebWorkerFixtures';
import { CancelablePromise } from 'cancelable-promise-jq';

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

  /**
   * Callback that will be executed when the worker fails, this not necessary affect the current message execution
   * */
  onWorkerError: (error: ErrorEvent) => void;
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
  progressPercentage?: number;

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

export interface IEasyWebWorkerMessage<TPayload = null, TResult = void> {
  /**
   * This is the message id
   */
  messageId: string;

  /**
   * This are the parameters included in the message
   * */
  payload: TPayload;

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
  resolve: TResult extends void ? () => void : (payload: TResult) => void;

  /**
   * This method is used to cancel the message from inside the worker
   * */
  cancel: (reason?: unknown) => void;
}

const getImportScriptsTemplate = (scripts: string[] = []) => {
  if (!scripts.length) return '';

  return `self.importScripts(["${scripts.join('","')}"]);`;
};

export const createBlobFromString = (
  source: string,
  imports: string[] = []
) => {
  const content = `${getImportScriptsTemplate(imports)}
  ${source}`;

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob([content], {
      type: 'application/javascript',
    })
  );
};

export const createBlobWorker = <IPayload = null, IResult = void>(
  source:
    | EasyWebWorkerBody<IPayload, IResult>
    | EasyWebWorkerBody<IPayload, IResult>[],
  imports: string[] = []
) => {
  const template = WorkerTemplate();

  const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
    Array.isArray(source) ? source : [source];

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob(
      [
        `${getImportScriptsTemplate(imports)}
    
        ${template}
    
        ${contentCollection
          .map(
            (content, index) =>
              `// content #${index}\n(${content.toString()})(easyWorker, self);`
          )
          .join('\n\n')}`,
      ],
      { type: 'application/javascript' }
    )
  );
};

/**
 * This is a class to create global-store objects
 * @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
 * @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
 * @param {EasyWebWorkerBody<IPayload, IResult> | EasyWebWorkerBody<IPayload, IResult>[]} workerBody -
 * this parameter should be a function or set of functions that will become the body of your Web-Worker
 * IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
 * the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
 * you could easily identify what is on the context of your Worker.
 * @param {Partial<IWorkerConfig>} WorkerConfig - You could add extra configuration to your worker,
 * consult IWorkerConfig description to have more information
 * */

export class EasyWebWorker<IPayload = null, IResult = void> {
  public name: string;

  /**
   * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
   */
  public worker: Worker;

  /**
   * These where send to the worker but not yet resolved
   */
  private messagesQueue: Map<string, EasyWebWorkerMessage<IPayload, IResult>> =
    new Map();

  /**
   * This is the URL of the worker file
   */
  public workerUrl: string;

  /**
   * This is the list of scripts that will be imported into the worker
   */
  public scripts: string[] = [];

  /**
   * This is the callback that will be executed when the worker throws an error
   */
  public onWorkerError: (error: ErrorEvent) => void;

  protected get isExternalWorkerFile(): boolean {
    return typeof this.workerBody === 'string';
  }

  constructor(
    /**
     * this parameter should be a function or set of functions that will become the body of your Web-Worker
     * IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
     * the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
     * you could easily identify what is on the context of your Worker.
     */
    protected workerBody:
      | EasyWebWorkerBody<IPayload, IResult>
      | EasyWebWorkerBody<IPayload, IResult>[]
      | string,

    /**
     * You could import scripts into your worker, this is useful if you want to use external libraries
     */
    { scripts = [], name, onWorkerError = null }: Partial<IWorkerConfig> = {}
  ) {
    this.name = name || generatedId();
    this.scripts = scripts;
    this.worker = this.createWorker();
    this.onWorkerError = onWorkerError;
  }

  private RemoveMessageFromQueue(messageId: string) {
    this.messagesQueue.delete(messageId);
  }

  /**
   * Categorizes the worker response and executes the corresponding callback
   */
  private executeMessageCallback(
    event: Pick<MessageEvent<IMessageData<IPayload>>, 'data'>
  ) {
    const message: EasyWebWorkerMessage<IPayload, IResult> | null =
      this.messagesQueue.get(event.data.messageId) ?? null;

    if (!message) return;

    const { payload, reason, wasCanceled, progressPercentage } = event.data;

    // worker was disposed before the message was resolved
    if (!this.worker) {
      this.RemoveMessageFromQueue(message.messageId);

      return;
    }

    // execute progress callback
    if (progressPercentage !== undefined) {
      message.reportProgress(progressPercentage);

      return;
    }

    // remove message from queue
    this.RemoveMessageFromQueue(message.messageId);
    message.wasCompleted = false;

    if (wasCanceled) {
      message.cancel(reason);

      return;
    }

    if (reason) {
      message.reject(reason);

      return;
    }

    message.wasCompleted = true;

    // resolve message with the serialized payload
    message.resolve(
      ...((payload ?? []) as unknown as IResult extends void
        ? [null?]
        : [IResult])
    );
  }

  protected getWorkerUrl(): string {
    if (this.isExternalWorkerFile) {
      return this.workerBody as string;
    }

    return createBlobWorker<IPayload, IResult>(
      this.workerBody as
        | EasyWebWorkerBody<IPayload, IResult>
        | EasyWebWorkerBody<IPayload, IResult>[],
      this.scripts
    );
  }

  protected createWorker(): Worker {
    this.workerUrl = this.getWorkerUrl();

    const worker = new Worker(this.workerUrl, {
      name: this.name,
    });

    worker.onmessage = (event: MessageEvent<IMessageData<IPayload>>) => {
      this.executeMessageCallback(event);
    };

    /**
     * If not handled, the error will be thrown to the global scope
     */
    worker.onerror = (reason) => {
      if (!this.onWorkerError) throw reason;

      this.onWorkerError(reason);
    };

    return worker;
  }

  /**
   * Terminates the worker and remove all messages from the queue
   * Execute the cancel callback of each message in the queue if provided
   * @param {unknown} reason - reason why the worker was terminated
   */
  public cancelAll(reason?: unknown): void {
    this.worker?.terminate();

    const messages = Array.from(this.messagesQueue.values());

    messages.forEach((message) => message.cancel(reason));

    this.messagesQueue = new Map();
  }

  /**
   * Send a message to the worker queue
   * @param {IPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public send = ((...payload: IPayload extends null ? [null?] : [IPayload]) => {
    const [$payload] = payload as [IPayload];
    const message = new EasyWebWorkerMessage<IPayload, IResult>($payload);

    const { messageId } = message;

    this.messagesQueue.set(message.messageId, message);

    this.worker?.postMessage({
      messageId,
      payload: $payload,
    });

    return message.decoupledPromise.promise;
  }) as unknown as IPayload extends null
    ? () => CancelablePromise<IResult>
    : (payload: IPayload) => CancelablePromise<IResult>;

  /**
   * This method terminate all current messages and send a new one to the worker queue
   * @param {IPayload} payload - whatever json data you want to send to the worker, should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public override = ((
    ...[payload, reason]: IPayload extends null
      ? [null?, unknown?]
      : [IPayload, unknown?]
  ) => {
    this.cancelAll(reason);

    return this.send(...([payload] as [IPayload]));
  }) as unknown as IPayload extends null
    ? (reason?: unknown) => CancelablePromise<IResult>
    : (payload: IPayload, reason?: unknown) => CancelablePromise<IResult>;

  /**
   * This method will alow the current message to be completed and send a new one to the worker queue after it, all the messages after the current one will be canceled
   * @param {IPayload} payload - whatever json data you want to send to the worker should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public overrideAfterCurrent = ((
    ...[payload, reason]: IPayload extends null
      ? [null?, unknown?]
      : [IPayload, unknown?]
  ) => {
    if (this.messagesQueue.size) {
      const [firstItem] = this.messagesQueue;
      const [, currentMessage] = firstItem;

      this.messagesQueue.delete(currentMessage.messageId);

      this.cancelAll(reason);

      this.messagesQueue.set(currentMessage.messageId, currentMessage);
    }

    return this.send(...([payload] as [IPayload]));
  }) as unknown as IPayload extends null
    ? (reason?: unknown) => CancelablePromise<IResult>
    : (payload: IPayload, reason?: unknown) => CancelablePromise<IResult>;

  /**
   * This method will remove the WebWorker and the BlobUrl
   */
  public dispose(): void {
    this.cancelAll();

    URL.revokeObjectURL(this.workerUrl);

    this.worker = null;
  }
}

export default EasyWebWorker;
