import * as IEasyWebWorker from './EasyWebWorkerTypes';
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
declare class EasyWebWorker<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorker<IPayload, IResult> {
    protected workerBody: IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[];
    name: string;
    private worker;
    private messagesQueue;
    workerUrl: string;
    protected scripts: string[];
    constructor(workerBody: IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[], { scripts, name, }?: Partial<IEasyWebWorker.IWorkerConfig>);
    private RemoveMessageFromQueue;
    private executeMessageCallback;
    protected createWorker(): Worker;
    /**
    * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
    */
    cancelAll(): void;
    /**
    * Send a message to the worker queue
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    send(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult>;
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    override(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult>;
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    overrideAfterCurrent(...payload: IPayload extends null ? [null?] : [IPayload]): IEasyWebWorker.IMessagePromise<IResult>;
    /**
    * This method will remove the WebWorker and the BlobUrl
    */
    dispose(): void;
}
export default EasyWebWorker;
//# sourceMappingURL=EasyWebWorker.d.ts.map