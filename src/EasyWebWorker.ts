/// <reference lib="webworker" />

import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import { getWorkerTemplate, generatedId } from './EasyWebWorkerFixtures';
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

export interface IWorkerData<IPayload> {
  /**
   * This is the message id
   * */
  messageId: string;

  execution?: {
    payload?: IPayload;
  };

  cancelation?: {
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
  messageId: string;

  /**
   * When present, this means that the message was resolved
   */
  resolved?: { payload: [IPayload?] };

  /**
   * When present, this means that the message was rejected
   * */
  rejected?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  canceled?: { reason: unknown };

  /**
   * When present, this means that the should report the progress
   * */
  progress?: {
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
  onMessage(
    method: string,
    callback: (
      message: IEasyWebWorkerMessage<IPayload, IResult>,
      event: MessageEvent<IMessageData<IPayload>>
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
  context: DedicatedWorkerGlobalScope & Record<string, unknown>
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
  reportProgress(progressPercentage: number, payload?: unknown): void;

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

export const createBlobWorker = <IPayload = null, IResult = void>(
  source:
    | EasyWebWorkerBody<IPayload, IResult>
    | EasyWebWorkerBody<IPayload, IResult>[],
  imports: string[] = [],
  origin: string = ''
) => {
  const template = getWorkerTemplate();

  const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
    Array.isArray(source) ? source : [source];

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob(
      [
        `${getImportScriptsTemplate(imports)}
        ${template}
        ${contentCollection
          .map((content) => {
            return `
            \n var easyWorker = createEasyWebWorker("${origin}");
            \n (${content})(easyWorker, self);`;
          })
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
    this.worker = this.initializeWorker();
    this.onWorkerError = onWorkerError;
  }

  private RemoveMessageFromQueue(messageId: string) {
    this.messagesQueue.delete(messageId);
  }

  /**
   * Categorizes the worker response and executes the corresponding callback
   */
  private executeMessageCallback(event: { data: IMessageData<IPayload> }) {
    const message = this.messagesQueue.get(event.data.messageId) ?? null;

    if (!message) return;

    const { progress } = event.data;

    // worker was disposed before the message was resolved
    if (!this.worker) {
      this.RemoveMessageFromQueue(message.messageId);

      return;
    }

    // execute progress callback
    if (progress) {
      const { percentage, payload } = progress;

      message.reportProgress(percentage, payload);

      return;
    }

    // remove message from queue
    this.RemoveMessageFromQueue(message.messageId);

    const { canceled } = event.data;

    if (canceled) {
      const { reason } = canceled;

      message.cancel(reason);

      return;
    }

    const { rejected } = event.data;

    if (rejected) {
      const { reason } = rejected;

      message.reject(reason);

      return;
    }

    const { resolved } = event.data;
    const { payload } = resolved;

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

  protected initializeWorker(): Worker {
    this.workerUrl = this.workerUrl ?? this.getWorkerUrl();

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
   * Execute the cancel callback of each message in the queue if provided
   * @param {unknown} reason - reason messages where canceled
   */
  public async cancelAll(reason?: unknown) {
    const messages = Array.from(this.messagesQueue.values());
    const promises: CancelablePromise[] = [];
    const total = messages.length;
    const percentage = 100 / total;

    messages.forEach((message) => {
      const { messageId, decoupledPromise } = message;
      const { promise } = decoupledPromise;

      // promises are gonna be rejected so we need to wait until they are settled
      promises.push(
        promise.catch((error) => {
          (
            promise.reportProgress as (
              percentage: number,
              payload?: unknown
            ) => void
          )(percentage, error);
        })
      );

      const data: IWorkerData<IPayload> = {
        messageId,
        cancelation: {
          reason,
        },
      };

      this.worker?.postMessage(data);
    });

    debugger;

    await Promise.all(promises);

    debugger;
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

    const data: IWorkerData<IPayload> = {
      messageId,
      execution: {
        payload: $payload,
      },
    };

    this.worker?.postMessage(data);

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
  public override = (async (
    ...[payload, reason]: IPayload extends null
      ? [null?, unknown?]
      : [IPayload, unknown?]
  ) => {
    await this.cancelAll(reason);

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
  public overrideAfterCurrent = (async (
    ...[payload, reason]: IPayload extends null
      ? [null?, unknown?]
      : [IPayload, unknown?]
  ) => {
    if (this.messagesQueue.size) {
      const [firstItem] = this.messagesQueue;
      const [, currentMessage] = firstItem;

      this.messagesQueue.delete(currentMessage.messageId);

      await this.cancelAll(reason);

      this.messagesQueue.set(currentMessage.messageId, currentMessage);
    }

    return this.send(...([payload] as [IPayload]));
  }) as unknown as IPayload extends null
    ? (reason?: unknown) => CancelablePromise<IResult>
    : (payload: IPayload, reason?: unknown) => CancelablePromise<IResult>;

  /**
   * This method will remove the WebWorker and the BlobUrl
   */
  public async dispose(): Promise<void> {
    await this.cancelAll();

    URL.revokeObjectURL(this.workerUrl);

    this.worker = null;
  }
}

export default EasyWebWorker;
