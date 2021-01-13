export declare type OnProgressCallback = (progressPercentage: number) => void;
export interface IWorkerConfig {
    /**
     **  External scripts that you want to include in your worker
     */
    scripts: string[];
    /**
     **  Identifier of your worker, this is in case you want to add a name to your worker file, otherwize an unique generic Id will be added as a name
     */
    name: string;
}
export interface IMessageData<IPayload = null> {
    payload: IPayload;
    error: string;
    progressPercentage: number;
    messageId: string;
}
export interface IEasyWorkerInstance<IPayload = null, IResult = void> {
    /**
    * Use this method to defined which will be the functionality of your worker when a message is send  to it
    * @param {(message: IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IMessageData<IPayload>>) => void} callback - current message
    // * @returns {void}
    * */
    onMessage(callback: (message: IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IMessageData<IPayload>>) => void): void;
}
export interface IEasyWebWorkerMessage<IPayload = null, IResult = void> {
    messageId: string;
    payload: IPayload;
    reject: (reason: Error) => void;
    reportProgress(progressPercentage: number): void;
    resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
}
/**
* This type defined the structure that a WorkerBody should have.
* @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
* @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
* @param {IEasyWorkerInstance<IPayload, IResult>} easyWorker - ,
*/
export declare type EasyWebWorkerBody<IPayload = null, IResult = void> = (easyWorker: IEasyWorkerInstance<IPayload, IResult>, context: any) => void;
export interface IMessagePromise<IResult = void> extends Promise<IResult> {
    onProgress: (callback: OnProgressCallback) => Promise<IResult>;
}
/**
* This is a class to create global-store objects
* @template IPayload - Indicates if your WORKERS messages requires a parameter to be provided, NULL indicates they doesn't
* @template IResult - Indicates if your WORKERS messages has a result... NULL indicates all you messages are Promise<void>
* @param {IEasyWebWorker.MessageBody<IPayload, IResult> | IEasyWebWorker.MessageBody<IPayload, IResult>[]} workerBody -
* this parameter should be a function or set of functions that will become the body of your Web-Worker
* IMPORTANT!! all WORKERS content is gonna be transpiled on run time, so you can not use any variable, method of resource that weren't included into the WORKER.
* the above the reason of why we are injecting all worker context into the MessageBody Callbacks, so,
* you could easily identify what is on the context of your Worker.
* @param {Partial<IEasyWebWorker.IWorkerConfig>} WorkerConfig - You could add extra configuration to your worker,
* consult IWorkerConfig description to have more information
* */
export interface IEasyWebWorker<IPayload = null, IResult = void> {
    name: string;
    workerUrl: string;
    /**
    * This method will remove the WebWorker and the BlobUrl
    */
    dispose(): void;
    /**
    * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
    */
    cancelAll(): void;
    /**
    * Send a message to the worker queue
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    send(...payload: IPayload extends null ? [null?] : [IPayload]): IMessagePromise<IResult>;
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    override(...payload: IPayload extends null ? [null?] : [IPayload]): IMessagePromise<IResult>;
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    overrideAfterCurrent(...payload: IPayload extends null ? [null?] : [IPayload]): IMessagePromise<IResult>;
}
//# sourceMappingURL=EasyWebWorkerTypes.d.ts.map