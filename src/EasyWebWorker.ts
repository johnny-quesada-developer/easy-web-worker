import EasyWebWorkerMessage from './EasyWebWorkerMessage';
import EasyWebWorkerFactory from './EasyWebWorkerFactory';
import { generatedId } from './EasyWebWorkerFixtures';
import {
  EasyWebWorkerBody,
  IMessageData,
  IMessagePromise,
  IWorkerConfig,
  OnProgressCallback,
} from './EasyWebWorkerTypes';

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
class EasyWebWorker<IPayload = null, IResult = void> {
  public name: string;

  /**
   * @deprecated Directly modifying the worker may lead to unexpected behavior. Use it only if you know what you are doing.
   */
  public worker: Worker | null;

  /**
   * These where send to the worker but not yet resolved
   */
  private messagesQueue: Map<string, EasyWebWorkerMessage<IPayload, IResult>> =
    new Map();

  public workerUrl: string = '';

  protected scripts: string[] = [];

  protected get isExternalWorkerFile(): boolean {
    return typeof this.workerBody === 'string';
  }

  constructor(
    protected workerBody:
      | EasyWebWorkerBody<IPayload, IResult>
      | EasyWebWorkerBody<IPayload, IResult>[]
      | string,
    { scripts = [], name }: Partial<IWorkerConfig> = {}
  ) {
    this.name = name || generatedId();
    this.scripts = scripts;
    this.worker = this.createWorker();
  }

  private RemoveMessageFromQueue(messageId: string) {
    this.messagesQueue.delete(messageId);
  }

  private executeMessageCallback(
    event: Partial<
      Omit<MessageEvent<IMessageData<IPayload>>, 'data'> & {
        data: Partial<MessageEvent<IMessageData<IPayload>>['data']>;
      }
    >
  ) {
    const message: EasyWebWorkerMessage<IPayload, IResult> | null =
      this.messagesQueue.get(event.data.messageId) ?? null;

    if (!message) return;

    const { payload, error, progressPercentage } = event.data;

    // worker was disposed
    if (!this.worker) {
      this.RemoveMessageFromQueue(message.messageId);
      message.wasCompleted = true;
      return;
    }

    if (progressPercentage !== undefined) {
      message.reportProgress(progressPercentage);
      return;
    }

    this.RemoveMessageFromQueue(message.messageId);

    if (error) {
      message.reject(error);
      return;
    }

    if (message.wasCanceled) {
      message.wasCompleted = true;
      return;
    }

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

    return EasyWebWorkerFactory.blobWorker<IPayload, IResult>(
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

    worker.onmessage = (event: MessageEvent<IMessageData<IPayload>>) =>
      this.executeMessageCallback(event);

    worker.onerror = (error) =>
      this.executeMessageCallback({ data: { error } });

    return worker;
  }

  /**
   * Terminates the worker and remove all messages from the queue
   * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
   */
  public cancelAll(): void {
    this.worker?.terminate();

    const messages = Array.from(this.messagesQueue.values());

    messages.forEach((message) => message.cancel());

    this.messagesQueue = new Map();
  }

  /**
   * Send a message to the worker queue
   * @param {IPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public send(
    ...payload: IPayload extends null ? [null?] : [IPayload]
  ): IMessagePromise<IResult> {
    const [$payload] = payload as [IPayload];
    const message = new EasyWebWorkerMessage<IPayload, IResult>($payload);

    const { messageId } = message;

    this.messagesQueue.set(message.messageId, message);

    this.worker?.postMessage({
      messageId,
      payload: $payload,
    });

    const result = message.promise as IMessagePromise<IResult>;

    result.onProgress = (callback: OnProgressCallback) => {
      message.reportProgress = callback;
      return message.promise;
    };

    return result;
  }

  /**
   * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
   * you could use OVERRIDE to that purpose.
   * @param {IPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public override(
    ...payload: IPayload extends null ? [null?] : [IPayload]
  ): IMessagePromise<IResult> {
    this.cancelAll();

    return this.send(...payload);
  }

  /**
   * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
   * you could use OVERRIDE to that purpose.
   * @param {IPayload} payload - whatever json data you want to send to the worker
   * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
   */
  public overrideAfterCurrent(
    ...payload: IPayload extends null ? [null?] : [IPayload]
  ): IMessagePromise<IResult> {
    if (this.messagesQueue.size) {
      const [firstItem] = this.messagesQueue;
      const [, currentMessage] = firstItem;

      this.cancelAll();
      currentMessage.wasCanceled = false;

      this.messagesQueue.set(currentMessage.messageId, currentMessage);
    }

    return this.send(...payload);
  }

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
