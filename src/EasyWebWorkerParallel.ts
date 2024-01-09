import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import { generatedId } from './EasyWebWorkerFixtures';
import { CancelablePromise, toCancelablePromise } from 'cancelable-promise-jq';
import {
  EasyWebWorkerBody,
  IWorkerConfig,
  IMessageData,
  IWorkerData,
  TOverrideConfig,
  EasyWebWorker,
} from 'EasyWebWorker';

/**
 * This is a class to create a new instance of the easy concurrent web worker
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
export class EasyWebWorkerParallel<TPayload = null, TResult = void> {
  public name: string;

  /**
   * This is the URL of the worker file
   */
  public baseUrl: string = null;

  /**
   * This is the list of scripts that will be imported into the worker
   */
  public scripts: string[] = [];

  public maxWorkers: number = null;

  /**
   * This is the callback that will be executed when the worker throws an error
   */
  public onWorkerError: (error: ErrorEvent) => void;

  private workers: Worker[] = [];

  public keepAlive: boolean = false;

  public terminationDelay: number = 1000;

  /**
   * These where send to the worker but not yet resolved
   */
  private messagesQueue: Map<string, EasyWebWorkerMessage<unknown, unknown>> =
    new Map();

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
      | Worker[],

    /**
     * You could import scripts into your worker, this is useful if you want to use external libraries
     */
    {
      scripts = [],
      name,
      onWorkerError = null,
      url = null,
      maxWorkers = 4,
      keepAlive = false,
      terminationDelay = 1000,
      warmUp = false,
    }: Partial<
      IWorkerConfig & {
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
        warmUp?: boolean;
      }
    > = {}
  ) {
    this.name = name || generatedId();
    this.scripts = scripts;
    this.onWorkerError = onWorkerError;
    this.baseUrl = url ?? null;
    this.maxWorkers = maxWorkers;
    this.keepAlive = warmUp || keepAlive;
    this.terminationDelay = terminationDelay;

    const { isArraySource, isArrayOfWebWorkers, baseUrl } =
      this.initializeWorkerBaseSource();

    this.baseUrl = baseUrl;
    this.maxWorkers = isArrayOfWebWorkers ? this.source.length : maxWorkers;
    this.keepAlive = isArrayOfWebWorkers ? true : keepAlive;

    if (!warmUp) return;

    this.warmUp();
  }

  private warmUp = () => {
    const { maxWorkers } = this;

    new Array(maxWorkers).fill(null).forEach(() => {
      this.getWorkerInstance(null);
    });
  };

  private RemoveMessageFromQueue(messageId: string) {
    this.messagesQueue.delete(messageId);

    (
      EasyWebWorker.prototype as unknown as {
        RemoveMessageFromQueue: (messageId: string) => void;
      }
    ).RemoveMessageFromQueue.call(this, messageId);
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
      ...((payload ?? []) as unknown as TResult extends void
        ? [null?]
        : [TResult])
    );
  }

  protected getWorkerUrl(): string {
    return (
      EasyWebWorker.prototype as unknown as {
        getWorkerUrl: () => string;
      }
    ).getWorkerUrl.call(this);
  }

  protected initializeWorkerBaseSource(): {
    baseUrl: string;
    isArrayOfWebWorkers: boolean;
    isArraySource?: boolean;
  } {
    const isUrlBase = typeof this.source === 'string';
    const isFunctionTemplate = typeof this.source === 'function';

    const isArraySource = Array.isArray(this.source);

    const isArrayOfFunctions =
      isArraySource && typeof this.source[0] === 'function';

    const isArrayOfWebWorkers =
      isArraySource && this.source[0] instanceof Worker;

    if (isUrlBase || isFunctionTemplate || isArrayOfFunctions) {
      const baseUrl = this.baseUrl ?? this.getWorkerUrl();

      return {
        isArrayOfWebWorkers,
        baseUrl,
        isArraySource,
      };
    }

    if (isArrayOfWebWorkers) {
      this.workers = (this.source as Worker[]).map(this.getWorkerInstance);

      return {
        isArrayOfWebWorkers,
        baseUrl: null,
        isArraySource,
      };
    }

    const isWebWorkerInstance = this.source instanceof Worker;

    const workerUrl = isWebWorkerInstance
      ? null
      : this.baseUrl ?? this.getWorkerUrl();

    return {
      isArrayOfWebWorkers,
      baseUrl: workerUrl,
      isArraySource,
    };
  }

  /**
   * Execute the cancel callback of each message in the queue if provided
   * @param {unknown} reason - reason messages where canceled
   * @param {boolean} force - if true, the messages will be cancelled immediately without waiting for the worker to respond
   * This action will reboot the worker
   */
  public cancelAll(reason?: unknown, { force = false } = {}) {
    return (
      EasyWebWorker.prototype as unknown as {
        cancelAll: (reason?: unknown, config?: { force?: boolean }) => void;
      }
    ).cancelAll.call(this, reason, { force });
  }

  protected addMessageToQueue(message: EasyWebWorkerMessage<unknown, unknown>) {
    (
      EasyWebWorker.prototype as unknown as {
        addMessageToQueue: (
          message: EasyWebWorkerMessage<unknown, unknown>
        ) => void;
      }
    ).addMessageToQueue.call(this, message);
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

  /**
   * Get a worker from the pool and rotate the pool
   */
  private getWorkerFromPool = (): Worker => {
    const worker = this.workers.shift();

    this.workers.push(worker);

    return worker;
  };

  private createNewWorkerInstance = (): Worker => {
    const worker = new Worker(this.baseUrl, {
      name: `${this.name}-${this.workers.length}`,
    });

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

  private getWorkerInstance = (_worker: Worker): Worker => {
    const { maxWorkers, messagesQueue } = this;
    const messagesQueueSize = messagesQueue.size;

    if (messagesQueueSize >= maxWorkers) {
      const worker = this.getWorkerFromPool();

      return worker;
    }

    const worker: Worker = _worker ?? this.createNewWorkerInstance();

    this.workers.push(worker);
  };

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

      worker.postMessage(data);

      return decoupledPromise.promise;
    };

    decoupledPromise.promise.finally(() => {
      if (this.keepAlive) return;

      setTimeout(() => {
        const { messagesQueue } = this;
        if (messagesQueue.size) return;

        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];
      }, this.terminationDelay);
    });

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
    ...[payload, reason, config]: TPayload extends null
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    return (
      EasyWebWorker.prototype as unknown as {
        override: (
          payload: TPayload,
          reason?: unknown,
          config?: TOverrideConfig
        ) => CancelablePromise<TResult>;
      }
    ).override.call(this, payload, reason, config);
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
    return (
      EasyWebWorker.prototype as unknown as {
        overrideAfterCurrent: (
          payload: TPayload,
          reason?: unknown,
          config?: TOverrideConfig
        ) => CancelablePromise<TResult>;
      }
    ).overrideAfterCurrent.call(this, payload, reason, config);
  }) as unknown as TPayload extends null
    ? (reason?: unknown, TOverrideConfig?) => CancelablePromise<TResult>
    : (
        payload: TPayload,
        reason?: unknown,
        config?: TOverrideConfig
      ) => CancelablePromise<TResult>;

  /**
   * This method will remove the WebWorker and the BlobUrl
   */
  public async dispose(): Promise<void> {
    await this.cancelAll(null);

    if (this.baseUrl) URL.revokeObjectURL(this.baseUrl);

    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}
