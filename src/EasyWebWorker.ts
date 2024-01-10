import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import { getWorkerTemplate, generatedId } from './EasyWebWorkerFixtures';
import { CancelablePromise, toCancelablePromise } from 'cancelable-promise-jq';

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

  workerOptions?: WorkerOptions;

  /**
   * Callback that will be executed when the worker fails, this not necessary affect the current message execution
   * */
  onWorkerError: (error: ErrorEvent) => void;

  /**
   * Url of the worker file, this is reserver for EasyWebWorker created from a Worker Instance
   */
  url?: string;

  /**
   * Maximum quantity of workers that will be created, default is 4
   */
  maxWorkers?: number;
  /**
   * Indicates if the worker should be kept alive after the message is completed
   * otherwise, the workers will be terminated after a configured delay has passed and there is no messages in the queue
   */
  keepAlive?: boolean;
  /**
   * Quantity of milliseconds to wait before terminating the worker if there is no messages in the queue
   */
  terminationDelay?: number;

  /**
   * Indicates whenever the maximum quantity of workers should be created at the initialization of the easy web worker,
   * If warmUp is true keepAlive will be set to true
   */
  warmUpWorkers?: boolean;

  /**
   * Allows to pass static primitive parameters to the worker
   */
  primitiveParameters?: TPrimitiveParameters;

  /**
   * Allows to override the worker file origin
   */
  origin?: string;
}

export interface IWorkerData<IPayload> {
  /**
   * This is the message id
   * */
  readonly messageId: string;

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
  readonly messageId: string;

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
  readonly worker_canceled?: { reason: unknown };

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

export interface IEasyWebWorkerMessage<TPayload = null, TResult = void> {
  /**
   * This is the message id
   */
  readonly messageId: string;

  /**
   * This are the parameters included in the message
   * */
  readonly payload: TPayload;

  /**
   * This method is used to reject the message from inside the worker
   * */
  readonly reject: (reason?: unknown) => void;

  /**
   * This method is used to report the progress of the message from inside the worker
   * */
  readonly reportProgress: (percentage: number, payload?: unknown) => void;

  /**
   * This method is used to resolve the message from inside the worker
   * */
  readonly resolve: [TResult] extends [void]
    ? () => void
    : (payload: TResult) => void;

  /**
   * This method is used to cancel the message from inside the worker
   * */
  readonly cancel: (reason?: unknown) => void;

  /**
   * Thus method is used to subscribe to the cancel event from the main thread
   */
  readonly onCancel: (callback: (reason?: unknown) => void) => void;
}

const getImportScriptsTemplate = (scripts: string[] = []) => {
  if (!scripts.length) return '';

  return `self.importScripts(["${scripts.join('","')}"]);`;
};

export const createBlobWorker = <
  IPayload = null,
  IResult = void,
  TPrimitiveParameters extends any[] = unknown[]
>(
  source:
    | EasyWebWorkerBody<IPayload, IResult>
    | EasyWebWorkerBody<IPayload, IResult>[],
  imports: string[] = [],
  origin: string = '',
  {
    primitiveParameters = [] as TPrimitiveParameters,
  }: {
    primitiveParameters?: TPrimitiveParameters;
  } = {}
) => {
  const contentCollection: EasyWebWorkerBody<IPayload, IResult>[] =
    Array.isArray(source) ? source : [source];

  const worker_content = `self.primitiveParameters=JSON.parse(\`${JSON.stringify(
    primitiveParameters ?? []
  )}\`);${getImportScriptsTemplate(
    imports
  )}${getWorkerTemplate()}${contentCollection
    .map((content) => {
      return `self.ew$=self.cw$("${origin}");(${content})(self.ew$, self);`;
    })
    .join('')}`;

  return (window.URL || window.webkitURL).createObjectURL(
    new Blob([worker_content], { type: 'application/javascript' })
  );
};

/**
 * This is a class to create an EasyWebWorker
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

export class EasyWebWorker<
  TPayload = null,
  TResult = void,
  TPrimitiveParameters extends any[] = unknown[]
> {
  public name: string;

  /**
   * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
   */
  public get worker(): Worker {
    return this.workers.length > 1 ? null : this.workers[0];
  }

  public maxWorkers: number = 1;

  private workers: Worker[] = [];

  public keepAlive: boolean = true;

  public warmUpWorkers: boolean = false;

  public terminationDelay: number = 1000;

  public origin: string = '';

  public primitiveParameters: TPrimitiveParameters = [] as TPrimitiveParameters;

  public workerOptions?: WorkerOptions;

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
      | Worker
      | Worker[],

    /**
     * You could import scripts into your worker, this is useful if you want to use external libraries
     */
    {
      scripts = [],
      name,
      onWorkerError = null,
      url = null,
      maxWorkers = 1,
      keepAlive: _keepAlive = null,
      terminationDelay = 1000,
      warmUpWorkers: _warmUpWorkers = null,
      primitiveParameters,
      origin = '',
      workerOptions,
    }: Partial<IWorkerConfig<TPrimitiveParameters>> = {}
  ) {
    const warmUpWorkers =
      !maxWorkers || maxWorkers === 1 ? true : _warmUpWorkers;
    const keepAlive = warmUpWorkers || (_keepAlive ?? false);

    this.workerOptions = workerOptions ?? {};

    this.name = this.workerOptions.name || name || generatedId();
    this.scripts = scripts;
    this.onWorkerError = onWorkerError;
    this.workerUrl = url ?? null;
    this.maxWorkers = maxWorkers;
    this.keepAlive = keepAlive;
    this.terminationDelay = terminationDelay;
    this.warmUpWorkers = warmUpWorkers;

    this.primitiveParameters = (primitiveParameters ??
      []) as TPrimitiveParameters;

    this.origin = origin;

    this.computeWorkerBaseSource();
    this.warmUp();
  }

  private warmUp = () => {
    if (!this.warmUpWorkers) return;

    const { maxWorkers } = this;

    new Array(maxWorkers).fill(null).forEach(() => this.getWorkerFromPool());
  };

  private fillWorkerMethods = (worker: Worker) => {
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
  };

  private createNewWorker = () => {
    let worker = new Worker(this.workerUrl, {
      ...this.workerOptions,
      name: (() => {
        const { length } = this.workers;
        if (length === 0) return this.name;

        return `${this.name}-${length}`;
      })(),
    });

    return this.fillWorkerMethods(worker);
  };

  private getWorkerFromPool = (): Worker => {
    const { maxWorkers, messagesQueue } = this;
    const messagesQueueSize = messagesQueue.size;

    // there are less workers than the maximum allowed, and there is messages in the queue
    if (
      !this.workers.length ||
      (this.workers.length < maxWorkers && messagesQueueSize)
    ) {
      const worker = this.createNewWorker();

      this.workers.push(worker);

      return worker;
    }

    // rotate the worker
    const worker = this.workers.shift();

    this.workers.push(worker);

    return worker;
  };

  protected computeWorkerBaseSource = () => {
    const { workerUrl, isArrayOfWebWorkers } = (() => {
      const isWorkerInstance = this.source instanceof Worker;

      if (isWorkerInstance) {
        // static simgle workers instance
        this.workers = [this.fillWorkerMethods(this.source as Worker)];

        return {
          isArrayOfWebWorkers: false,
          workerUrl: null,
        };
      }

      const isUrlBase = typeof this.source === 'string';
      const isFunctionTemplate = typeof this.source === 'function';

      if (isUrlBase || isFunctionTemplate) {
        const workerUrl = this.workerUrl ?? this.getWorkerUrl();

        return {
          isArrayOfWebWorkers: false,
          workerUrl,
        };
      }

      const isArraySource = Array.isArray(this.source);

      const isArrayOfFunctionsTemplates =
        isArraySource && typeof this.source[0] === 'function';

      if (isArrayOfFunctionsTemplates) {
        const workerUrl = this.workerUrl ?? this.getWorkerUrl();

        return {
          isArrayOfWebWorkers: false,
          workerUrl,
        };
      }

      const isArrayOfWebWorkers =
        isArraySource && this.source[0] instanceof Worker;

      if (isArrayOfWebWorkers) {
        // static workers collection
        this.workers = (this.source as Worker[]).map(this.fillWorkerMethods);

        return {
          isArrayOfWebWorkers,
          workerUrl: null,
        };
      }

      return {
        isArrayOfWebWorkers: false,
        workerUrl: null,
      };
    })();

    this.workerUrl = workerUrl;

    this.maxWorkers = isArrayOfWebWorkers
      ? this.workers.length
      : this.maxWorkers;

    // if the source is an array of web workers we need to keep them alive
    this.keepAlive = isArrayOfWebWorkers ? true : this.keepAlive;
  };

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

    // workers were disposed before the message was resolved
    if (!this.workers.length) {
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
      ...((payload ?? []) as unknown as [TResult] extends [void]
        ? [null?]
        : [TResult])
    );
  }

  protected getWorkerUrl(): string {
    if (this.isExternalWorkerFile) {
      return this.source as string;
    }

    return createBlobWorker<TPayload, TResult, TPrimitiveParameters>(
      this.source as
        | EasyWebWorkerBody<TPayload, TResult>
        | EasyWebWorkerBody<TPayload, TResult>[],
      this.scripts,
      this.origin ?? '',
      {
        primitiveParameters: this.primitiveParameters,
      }
    );
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
    payload?: TPayload_,
    transfer?: Transferable[]
  ): CancelablePromise<TResult_> {
    return this.sendToWorker<TPayload_, TResult_>(
      { method, payload },
      transfer
    );
  }

  /**
   * Send a message to the worker queue
   * @param {TPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public send = ((
    payload: TPayload,
    transfer?: Transferable[]
  ): CancelablePromise<TResult> => {
    return this.sendToWorker<TPayload, TResult>({ payload }, transfer);
  }) as [TPayload] extends [null]
    ? () => CancelablePromise<TResult>
    : (payload: TPayload) => CancelablePromise<TResult>;

  private sendToWorker = <TPayload_ = null, TResult_ = void>(
    {
      payload,
      method,
    }: {
      payload?: TPayload_;
      method?: string;
    },
    transfer?: Transferable[]
  ): CancelablePromise<TResult_> => {
    const message = new EasyWebWorkerMessage<TPayload_, TResult_>();
    const { messageId, decoupledPromise } = message;

    const { cancel } = decoupledPromise;

    const worker = this.getWorkerFromPool();

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
      if (!this.workers.length) {
        cancel(reason);

        return toCancelablePromise(Promise.reject(reason));
      }

      worker.postMessage(data, transfer);

      return decoupledPromise.promise;
    };

    if (!this.keepAlive) {
      decoupledPromise.promise?.finally?.(() => {
        setTimeout(() => {
          const { messagesQueue } = this;
          if (messagesQueue.size) return;

          this.workers.forEach((worker) => worker.terminate());
          this.workers = [];
        }, this.terminationDelay);
      });
    }

    this.addMessageToQueue(message as EasyWebWorkerMessage<unknown, unknown>);

    const data: IWorkerData<TPayload_> = {
      messageId,
      method,
      execution: {
        payload,
      },
    };

    worker.postMessage(data);

    return decoupledPromise.promise;
  };

  /**
   * This method terminate all current messages and send a new one to the worker queue
   * @param {TPayload} payload - whatever json data you want to send to the worker, should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public override = (async (
    ...[payload, reason, config]: [TPayload] extends [null]
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    await this.cancelAll(reason, config);

    return this.send(...([payload] as [TPayload]));
  }) as unknown as [TPayload] extends [null]
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
    ...[payload, reason, config]: [TPayload] extends [null]
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
  }) as unknown as [TPayload] extends [null]
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
    if (!this.workerUrl) {
      throw new Error(
        'You can not reboot a worker that was created from a Worker Instance'
      );
    }

    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];

    // the messages need to be canceled before the worker is restarted to force an immediate rejection
    const resolutionPromises = this.cancelAll(reason);

    this.warmUp();

    return resolutionPromises;
  }

  /**
   * This method will remove the WebWorker and the BlobUrl
   */
  public async dispose(): Promise<void> {
    await this.cancelAll(null);

    if (this.workerUrl) URL.revokeObjectURL(this.workerUrl);

    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}
