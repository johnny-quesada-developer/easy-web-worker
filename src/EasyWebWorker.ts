import * as IEasyWebWorker from './EasyWebWorkerTypes';
import EasyWebWorkerMessage from './EasyWebWorkerMessage';
import EasyWebWorkerFactory from './EasyWebWorkerFactory';
import { generatedId } from './EasyWebWorkerFixtures';

/**
* This is a class to create global-store objects
* @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
* @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
* @param {IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[]} workerBody -
* this parameter should be a function or set of functions that will become the body of your Web-Worker
* IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
* the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
* you could easily identify what is on the context of your Worker.
* @param {Partial<IEasyWebWorker.IWorkerConfig>} WorkerConfig - You could add extra configuration to your worker,
* consult IWorkerConfig description to have more information
* */
class EasyWebWorker <IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorker<IPayload, IResult> {

    public name: string;

    private worker: Worker | null;

    private messagesQueue: EasyWebWorkerMessage<IPayload, IResult>[] = [];

    public workerUrl: string = '';

    protected scripts: string[] = [];

    protected get isExternalWorkerFile (): boolean {
      return typeof this.workerBody === 'string';
    }

    constructor(
      protected workerBody: IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[] | string,
      {
        scripts = [],
        name,
      }: Partial<IEasyWebWorker.IWorkerConfig> = {},
    ) {
      this.name = name || generatedId();
      this.scripts = scripts;
      this.worker = this.createWorker();
    }

    private RemoveMessageFromQueue(messageId: string) {
      this.messagesQueue = this.messagesQueue.filter(({ messageId: key }) => key !== messageId);
    }

    private executeMessageCallback(event: any) {
      // eslint-disable-next-line max-len
      const message: EasyWebWorkerMessage<IPayload, IResult> | undefined = this.messagesQueue.find(({ messageId: key }) => key === event.data.messageId);

      if (message) {
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

        message.resolve(...(payload || []));
      }
    }

    protected getWorkerUrl(): string {
      if(this.isExternalWorkerFile) {
        return this.workerBody as string
      }

      return EasyWebWorkerFactory
          .blobWorker<IPayload, IResult>(this.workerBody as IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[], this.scripts);
    }

    protected createWorker(): Worker {
      this.workerUrl = this.getWorkerUrl();

      const worker = new Worker(this.workerUrl, {
        name: this.name,
      });

      worker.onmessage = (event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>) => this.executeMessageCallback(event);
      worker.onerror = (error: ErrorEvent) => this.executeMessageCallback({ data: { error } });

      return worker;
    }

    /**
    * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
    */
    public cancelAll(): void {
      this.messagesQueue.forEach((message) => message.cancel());
      this.messagesQueue = [];
    }

    /**
    * Send a message to the worker queue
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    public send(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult> {
      const [_payload] = payload as [IPayload];
      const message = new EasyWebWorkerMessage<IPayload, IResult>(_payload);
      const { messageId } = message;

      this.messagesQueue.push(message);
      this.worker?.postMessage({
        messageId,
        payload: _payload,
      });

      const result: IEasyWebWorker.IMessagePromise<IResult> = message.promise as any;

      result.onProgress = (callback: IEasyWebWorker.OnProgressCallback) => {
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
    public override(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult> {
      this.cancelAll();
      return this.send(...payload);
    }

    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    public overrideAfterCurrent(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult> {
      if (this.messagesQueue.length) {
        const [currentMessage] = this.messagesQueue;

        this.cancelAll();
        currentMessage.wasCanceled = false;
        this.messagesQueue.push(currentMessage);
      }

      return this.send(...payload);
    }

    /**
    * This method will remove the WebWorker and the BlobUrl
    */
    public dispose(): void {
      this.cancelAll();
      this.worker?.terminate();
      URL.revokeObjectURL(this.workerUrl);
      this.worker = null;
    }

}

export default EasyWebWorker;
