import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import {
  getWorkerTemplate,
  generatedId,
  simpleMinifier,
} from './EasyWebWorkerFixtures';
import { CancelablePromise, toCancelablePromise } from 'cancelable-promise-jq';

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

  /**
   * Url of the worker file, this is reserver for EasyWebWorker created from a Worker Instance
   */
  url?: string;
}

export interface IWorkerData<IPayload> {
  /**
   * This is the message id
   * */
  messageId: string;

  method?: string;

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
   * When present, this means that the message was canceled from inside the worker
   * */
  worker_canceled?: { reason: unknown };

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

type TOverrideConfig = {
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
  reportProgress(percentage: number, payload?: unknown): void;

  /**
   * This method is used to resolve the message from inside the worker
   * */
  resolve: TResult extends void ? () => void : (payload: TResult) => void;

  /**
   * This method is used to cancel the message from inside the worker
   * */
  cancel: (reason?: unknown) => void;

  /**
   * Thus method is used to subscribe to the cancel event from the main thread
   */
  onCancel: (callback: (reason?: unknown) => void) => void;
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
  const isDevMode = window.process?.env?.DEV_MODE == 'true';

  const template = getWorkerTemplate();

  const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
    Array.isArray(source) ? source : [source];

  let worker_content = `${getImportScriptsTemplate(imports)}
  ${template}
  ${contentCollection
    .map((content) => {
      return `
      \n var easyWorker = createEasyWebWorker("${origin}");
      \n (${content})(easyWorker, self);`;
    })
    .join('\n\n')}`;

  worker_content = isDevMode ? worker_content : simpleMinifier(worker_content);

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob([worker_content], { type: 'application/javascript' })
  );
};

/**
 * This is a class to create global-store objects
 * @template TPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
 * @template TResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
 * @param {EasyWebWorkerBody<TPayload, TResult> | EasyWebWorkerBody<TPayload, TResult>[]} workerBody -
 * this parameter should be a function or set of functions that will become the body of your Web-Worker
 * IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
 * the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
 * you could easily identify what is on the context of your Worker.
 * @param {Partial<IWorkerConfig>} WorkerConfig - You could add extra configuration to your worker,
 * consult IWorkerConfig description to have more information
 * */

export class EasyWebWorker<TPayload = null, TResult = void> {
  public name: string;

  /**
   * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
   */
  public worker: Worker;

  /**
   * These where send to the worker but not yet resolved
   */
  private messagesQueue: Map<string, EasyWebWorkerMessage<unknown, unknown>> =
    new Map();

  /**
   * This is the URL of the worker file
   */
  public workerUrl: string = null;

  /**
   * This is the list of scripts that will be imported into the worker
   */
  public scripts: string[] = [];

  /**
   * This is the callback that will be executed when the worker throws an error
   */
  public onWorkerError: (error: ErrorEvent) => void;

  protected get isExternalWorkerFile(): boolean {
    return typeof this.source === 'string';
  }

  constructor(
    /**
     * this parameter should be a function or set of functions that will become the body of your Web-Worker
     * IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
     * the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
     * you could easily identify what is on the context of your Worker.
     */
    protected source:
      | EasyWebWorkerBody<TPayload, TResult>
      | EasyWebWorkerBody<TPayload, TResult>[]
      | string
      | Worker,

    /**
     * You could import scripts into your worker, this is useful if you want to use external libraries
     */
    {
      scripts = [],
      name,
      onWorkerError = null,
      url = null,
    }: Partial<IWorkerConfig> = {}
  ) {
    this.name = name || generatedId();
    this.scripts = scripts;
    this.worker = this.initializeWorker();
    this.onWorkerError = onWorkerError;

    if (url) {
      this.workerUrl = url;
    }
  }

  private RemoveMessageFromQueue(messageId: string) {
    this.messagesQueue.delete(messageId);
  }

  /**
   * Categorizes the worker response and executes the corresponding callback
   */
  private executeMessageCallback(event: { data: IMessageData<TPayload> }) {
    const message = this.messagesQueue.get(event.data.messageId) ?? null;

    if (!message) return;

    const { progress } = event.data;

    // worker was disposed before the message was resolved
    if (!this.worker) {
      this.RemoveMessageFromQueue(message.messageId);

      return;
    }

    const { decoupledPromise } = message;

    // execute progress callback
    if (progress) {
      const { percentage, payload } = progress;

      decoupledPromise.reportProgress(percentage, payload);

      return;
    }

    // remove message from queue
    this.RemoveMessageFromQueue(message.messageId);

    const { worker_canceled } = event.data;

    if (worker_canceled) {
      const { reason } = worker_canceled;

      decoupledPromise.reject(reason);

      return;
    }

    const { rejected } = event.data;

    if (rejected) {
      const { reason } = rejected;

      decoupledPromise.reject(reason);

      return;
    }

    const { resolved } = event.data;
    const { payload } = resolved;

    // resolve message with the serialized payload
    decoupledPromise.resolve(
      ...((payload ?? []) as unknown as TResult extends void
        ? [null?]
        : [TResult])
    );
  }

  protected getWorkerUrl(): string {
    if (this.isExternalWorkerFile) {
      return this.source as string;
    }

    return createBlobWorker<TPayload, TResult>(
      this.source as
        | EasyWebWorkerBody<TPayload, TResult>
        | EasyWebWorkerBody<TPayload, TResult>[],
      this.scripts
    );
  }

  protected initializeWorker(): Worker {
    const isWebWorkerInstance = this.source instanceof Worker;

    if (!isWebWorkerInstance) {
      this.workerUrl = this.workerUrl ?? this.getWorkerUrl();
    }

    const worker = (
      isWebWorkerInstance
        ? this.source
        : new Worker(this.workerUrl, {
            name: this.name,
          })
    ) as Worker;

    worker.onmessage = (event: MessageEvent<IMessageData<TPayload>>) => {
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
   * @param {boolean} force - if true, the messages will be cancelled immediately without waiting for the worker to respond
   * This action will reboot the worker
   */
  public cancelAll(reason?: unknown, { force = false } = {}) {
    const messages = Array.from(this.messagesQueue.values());
    const total = messages.length;
    const percentage = 100 / total;

    if (force) {
      return this.reboot(reason);
    }

    const rejectedPromises = messages.map((message) => {
      const { decoupledPromise } = message;
      const { promise } = decoupledPromise;

      // promises are gonna be rejected so we need to wait until they are settled
      return promise.cancel(reason).catch((error) => {
        promise.reportProgress(percentage, error);

        return error;
      });
    });

    return Promise.all(rejectedPromises);
  }

  protected addMessageToQueue(message: EasyWebWorkerMessage<unknown, unknown>) {
    this.messagesQueue.set(message.messageId, message);
  }

  /**
   * Send a message to the worker queue to an specific method
   * @template TResult_ - result type of the message (if any)
   * @template TPayload_ - payload type of the message  (if any)
   * @param {string} method - method name
   * @param {TPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public sendToMethod<TResult_ = void, TPayload_ = null>(
    method: string,
    payload?: TPayload_
  ): CancelablePromise<TResult_> {
    return this.sendToWorker<TPayload_, TResult_>({ method, payload });
  }

  /**
   * Send a message to the worker queue
   * @param {TPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public send = ((
    ...payload: TPayload extends null ? [null?] : [TPayload]
  ): CancelablePromise<TResult> => {
    const [$payload] = payload as [TPayload];

    return this.sendToWorker<TPayload, TResult>({ payload: $payload });
  }) as unknown as TPayload extends null
    ? () => CancelablePromise<TResult>
    : (payload: TPayload) => CancelablePromise<TResult>;

  private sendToWorker = <TPayload_ = null, TResult_ = void>({
    payload,
    method,
  }: {
    payload?: TPayload_;
    method?: string;
  }): CancelablePromise<TResult_> => {
    const message = new EasyWebWorkerMessage<TPayload_, TResult_>();
    const { messageId, decoupledPromise } = message;

    const { cancel } = decoupledPromise;

    decoupledPromise.promise.cancel = (reason) => {
      // restore the original cancel method so we can cancel the message when the worker response
      decoupledPromise.cancel = cancel;

      // if the message is canceled, we need to send a cancelation message to the worker,
      // once the worker response, the message will be removed from the queue nad the promise will be canceled in the main thread
      const data: IWorkerData<TPayload_> = {
        messageId,
        method,
        cancelation: {
          reason,
        },
      };

      // if the worker was disposed, we need to automatically reject the promise
      if (!this.worker) {
        cancel(reason);

        return toCancelablePromise(Promise.reject(reason));
      }

      this.worker?.postMessage(data);

      return decoupledPromise.promise;
    };

    this.addMessageToQueue(message as EasyWebWorkerMessage<unknown, unknown>);

    const data: IWorkerData<TPayload_> = {
      messageId,
      method,
      execution: {
        payload,
      },
    };

    this.worker?.postMessage(data);

    return decoupledPromise.promise;
  };

  /**
   * This method terminate all current messages and send a new one to the worker queue
   * @param {TPayload} payload - whatever json data you want to send to the worker, should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public override = (async (
    ...[payload, reason, config]: TPayload extends null
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    await this.cancelAll(reason, config);

    return this.send(...([payload] as [TPayload]));
  }) as unknown as TPayload extends null
    ? (reason?: unknown, config?: TOverrideConfig) => CancelablePromise<TResult>
    : (
        payload: TPayload,
        reason?: unknown,
        config?: TOverrideConfig
      ) => CancelablePromise<TResult>;

  /**
   * This method will alow the current message to be completed and send a new one to the worker queue after it, all the messages after the current one will be canceled
   * @param {TPayload} payload - whatever json data you want to send to the worker should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public overrideAfterCurrent = (async (
    ...[payload, reason, config]: TPayload extends null
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    if (this.messagesQueue.size) {
      const [firstItem] = this.messagesQueue;
      const [, currentMessage] = firstItem;

      this.RemoveMessageFromQueue(currentMessage.messageId);

      await this.cancelAll(reason, config);

      this.addMessageToQueue(currentMessage);
    }

    return this.send(...([payload] as [TPayload]));
  }) as unknown as TPayload extends null
    ? (reason?: unknown, TOverrideConfig?) => CancelablePromise<TResult>
    : (
        payload: TPayload,
        reason?: unknown,
        config?: TOverrideConfig
      ) => CancelablePromise<TResult>;

  /**
   * This method will reboot the worker and cancel all the messages in the queue
   * @param {unknown} reason - reason why the worker will be restarted
   */
  public reboot(reason: unknown = 'Worker was rebooted') {
    this.worker.terminate();
    this.worker = null;

    // the messages need to be canceled before the worker is restarted to force an immediate rejection
    const resolutionPromises = this.cancelAll(reason);

    this.worker = this.initializeWorker();

    return resolutionPromises;
  }

  /**
   * This method will remove the WebWorker and the BlobUrl
   */
  public async dispose(): Promise<void> {
    await this.cancelAll(null);

    URL.revokeObjectURL(this.workerUrl);

    this.worker.terminate();

    this.worker = null;
  }
}
