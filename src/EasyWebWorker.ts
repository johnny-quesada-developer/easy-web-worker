import { CancelablePromise } from 'easy-cancelable-promise/CancelablePromise';
import { groupAsCancelablePromise } from 'easy-cancelable-promise/groupAsCancelablePromise';

import {
  EasyWebWorkerBody,
  IWorkerConfig,
  IMessageData,
  IWorkerData,
  TOverrideConfig,
} from './types';

import { EasyWebWorkerMessage } from './EasyWebWorkerMessage';
import { uniqueId } from './uniqueId';
import { createBlobWorker } from './createBlobWorker';

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
  /**
   * This is the URL of the worker file
   */
  public workerUrl?: string | URL | null = null;

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public name: string;

  /**
   * Worker configuration
   */
  public config: Partial<IWorkerConfig<TPrimitiveParameters>> = null;

  /**
   * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
   * this property will be removed in the next major version
   */
  public get worker(): Worker {
    return this.workers.length > 1 ? null : this.workers[0];
  }

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public maxWorkers: number = 1;

  /**
   * @deprecated avoid direct access to the workers unless you know what you are doing
   */
  public workers: Worker[] = [];

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public keepAlive: boolean = true;

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public warmUpWorkers: boolean = false;

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public terminationDelay: number = 1000;

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public primitiveParameters: TPrimitiveParameters = [] as TPrimitiveParameters;

  /**
   * @deprecated this will be removed in the next major version and keep it just inside the config object
   */
  public workerOptions?: WorkerOptions;

  /**
   * These where send to the worker but not yet resolved
   */
  private messagesQueue: Map<string, EasyWebWorkerMessage<unknown, unknown>> =
    new Map();

  /**
   * @deprecated this will be removed in the next major version to be grouped as a worker option object
   * This is the list of scripts that will be imported into the worker
   */
  public scripts: string[] = [];

  /**
   * @deprecated this will be removed in the next major version to be grouped as a worker option object
   * This is the callback that will be executed when the worker throws an error
   */
  public onWorkerError: (error: ErrorEvent) => void;

  protected get isExternalWorkerFile(): boolean {
    return typeof this.source === 'string' || this.source instanceof URL;
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
      | URL
      | Worker
      | Worker[],

    /**
     * You could import scripts into your worker, this is useful if you want to use external libraries
     */
    config: Partial<IWorkerConfig<TPrimitiveParameters>> = {}
  ) {
    this.workerUrl =
      typeof source === 'string' || source instanceof URL ? source : null;

    const {
      scripts = [],
      name,
      onWorkerError = null,
      maxWorkers = 1,
      terminationDelay = 1000,
      primitiveParameters,
      workerOptions = {},
    } = config ?? ({} as IWorkerConfig<TPrimitiveParameters>);

    const warmUpWorkers = (() => {
      if (typeof config?.warmUpWorkers === 'boolean')
        return config.warmUpWorkers;

      const defaultWarmUpSingleWorker = maxWorkers === 1;
      if (defaultWarmUpSingleWorker) return true;

      return false;
    })();

    let keepAlive = (() => {
      if (typeof config?.keepAlive === 'boolean') return config.keepAlive;

      return warmUpWorkers;
    })();

    this.config = {
      scripts: scripts ?? [],
      name,
      maxWorkers,
      keepAlive,
      warmUpWorkers,
      workerOptions: {
        ...(workerOptions ?? {}),
        name: workerOptions.name || uniqueId('wk:'),
      },
      onWorkerError,
      terminationDelay,
      primitiveParameters: primitiveParameters as TPrimitiveParameters,
    };

    /**
     * @deprecated this will be removed in the next major version and keep it just inside the config object
     */
    this.workerOptions = this.config.workerOptions;
    this.name = this.workerOptions.name;
    this.scripts = scripts;
    this.onWorkerError = onWorkerError;
    this.maxWorkers = maxWorkers;
    this.terminationDelay = terminationDelay;
    this.warmUpWorkers = warmUpWorkers;
    this.primitiveParameters = (primitiveParameters ??
      []) as TPrimitiveParameters;

    const { isArrayOfWebWorkers } = this.computeWorkerBaseSource();

    // if the source is an array of web workers we need to keep them alive
    keepAlive = isArrayOfWebWorkers ? true : keepAlive;

    this.keepAlive = keepAlive;

    this.config.keepAlive = keepAlive;

    this.warmUp();
  }

  private warmUp = () => {
    const { warmUpWorkers, maxWorkers } = this.config;

    if (!warmUpWorkers) return;

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
      const { onWorkerError } = this.config;

      if (!onWorkerError) throw reason;

      onWorkerError(reason);
    };

    return worker;
  };

  private createNewWorker = () => {
    const { workerUrl } = this;
    const { workerOptions } = this.config;

    workerOptions.name = (() => {
      const { length } = this.workers;
      if (length === 0) return workerOptions.name;

      return `${workerOptions.name}-${length}`;
    })();

    const worker = new Worker(workerUrl, workerOptions);

    return this.fillWorkerMethods(worker);
  };

  private getWorkerFromPool = (): Worker => {
    const { maxWorkers, warmUpWorkers } = this.config;

    const { messagesQueue } = this;
    const messagesQueueSize = messagesQueue.size;

    // there are less workers than the maximum allowed, and there is messages in the queue
    if (
      !this.workers.length ||
      (this.workers.length < maxWorkers && (messagesQueueSize || warmUpWorkers))
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
        // static simple workers instance
        this.workers = [this.fillWorkerMethods(this.source as Worker)];

        return {
          isArrayOfWebWorkers: false,
          workerUrl: null,
        };
      }

      const isUrlBase =
        typeof this.source === 'string' || this.source instanceof URL;
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

    this.config.maxWorkers = isArrayOfWebWorkers
      ? this.workers.length
      : this.config.maxWorkers;

    return { isArrayOfWebWorkers };
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

    const { worker_cancelation } = event.data;

    if (worker_cancelation) {
      const { reason } = worker_cancelation;

      decoupledPromise._cancel(reason);

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

    const { primitiveParameters, scripts } = this.config;

    return createBlobWorker<TPayload, TResult, TPrimitiveParameters>(
      this.source as
        | EasyWebWorkerBody<TPayload, TResult>
        | EasyWebWorkerBody<TPayload, TResult>[],
      scripts,
      {
        primitiveParameters,
      }
    );
  }

  /**
   * Execute the cancel callback of each message in the queue if provided
   * @param {unknown} reason - reason messages where canceled
   * @param {boolean} force - if true, the messages will be cancelled immediately without waiting for the worker to respond
   * This action will reboot the worker
   */
  public cancelAll(
    reason?: unknown,
    { force = false } = {}
  ): CancelablePromise<unknown[]> {
    return new CancelablePromise<unknown[]>(
      async (resolve, _, { onCancel, reportProgress }) => {
        const messages = Array.from(this.messagesQueue?.values() ?? []);
        const total = messages.length;
        const percentage = 100 / total;

        if (force) {
          return resolve(this.reboot(reason));
        }

        const resultsPromise = groupAsCancelablePromise(
          messages.map((message) => {
            const { decoupledPromise } = message;
            const { promise } = decoupledPromise;

            // promises are gonna be rejected so we need to wait until they are settled
            return promise.cancel(reason).catch((error) => {
              reportProgress(percentage, error);

              return error;
            });
          })
        );

        onCancel(() => {
          resultsPromise.cancel();
        });

        resolve(resultsPromise);
      }
    );
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
    : (
        payload: TPayload,
        transfer?: Transferable[]
      ) => CancelablePromise<TResult>;

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

    const worker = this.getWorkerFromPool();

    decoupledPromise.promise.cancel = (reason) => {
      decoupledPromise.promise.cancel = decoupledPromise._cancel;

      // if the message is canceled, we need to send a cancelation message to the worker,
      // once the worker response, the message will be removed from the queue nad the promise will be canceled in the main thread
      const data: IWorkerData<TPayload_> = {
        messageId,
        __is_easy_web_worker_message__: true,
        method,
        cancelation: {
          reason,
        },
      };

      // if the worker was disposed, we need to automatically reject the promise
      if (!this.workers.length) {
        return decoupledPromise.cancel(reason);
      }

      worker.postMessage(data, transfer);

      return decoupledPromise.promise;
    };

    if (!this.config.keepAlive) {
      decoupledPromise.promise?.finally?.(() => {
        setTimeout(() => {
          const { messagesQueue } = this;
          if (messagesQueue.size) return;

          this.workers.forEach((worker) => worker.terminate());
          this.workers = [];
        }, this.config.terminationDelay);
      });
    }

    this.addMessageToQueue(message as EasyWebWorkerMessage<unknown, unknown>);

    const data: IWorkerData<TPayload_> = {
      messageId,
      __is_easy_web_worker_message__: true,
      method,
      execution: {
        payload,
      },
    };

    worker.postMessage(data, transfer);

    return decoupledPromise.promise;
  };

  /**
   * This method terminate all current messages and send a new one to the worker queue
   * @param {TPayload} payload - whatever json data you want to send to the worker, should be serializable
   * @param {unknown} reason - reason why the worker was terminated
   * @returns {IMessagePromise<TResult>} generated defer that will be resolved when the message completed
   */
  public override = ((
    ...[payload, reason, config]: [TPayload] extends [null]
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    return new CancelablePromise<TResult>(async (resolve, _, { onCancel }) => {
      const cancelAllPromise = this.cancelAll(reason, config);

      const unsubscribe = onCancel(() => {
        cancelAllPromise.cancel();
      });

      await cancelAllPromise;

      // callback is not needed anymore
      unsubscribe();

      resolve(this.send(...([payload] as [TPayload])));
    });
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
  public overrideAfterCurrent = ((
    ...[payload, reason, config]: [TPayload] extends [null]
      ? [null?, unknown?, TOverrideConfig?]
      : [TPayload, unknown?, TOverrideConfig?]
  ) => {
    return new CancelablePromise<TResult>(
      async (resolve, _, { onCancel, reportProgress }) => {
        if (this.messagesQueue.size) {
          const [firstItem] = this.messagesQueue;
          const [, currentMessage] = firstItem;

          this.RemoveMessageFromQueue(currentMessage.messageId);

          const cancelAllPromise = this.cancelAll(reason, config).onProgress(
            reportProgress
          );

          const unsubscribe = onCancel(() => {
            cancelAllPromise.cancel();
          });

          this.addMessageToQueue(currentMessage);

          await cancelAllPromise;

          // callback is not needed anymore
          unsubscribe();
        }

        resolve(this.send(...([payload] as [TPayload])));
      }
    );
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

    if (this.workerUrl) {
      (window.URL || window.webkitURL).revokeObjectURL(
        typeof this.workerUrl === 'string'
          ? this.workerUrl
          : this.workerUrl.href
      );
    }

    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}
