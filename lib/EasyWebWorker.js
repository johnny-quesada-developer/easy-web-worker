"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const EasyWebWorkerMessage_1 = tslib_1.__importDefault(require("./EasyWebWorkerMessage"));
const EasyWebWorkerFactory_1 = tslib_1.__importDefault(require("./EasyWebWorkerFactory"));
const EasyWebWorkerFixtures_1 = require("./EasyWebWorkerFixtures");
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
class EasyWebWorker {
    constructor(workerBody, { scripts = [], name, } = {}) {
        this.workerBody = workerBody;
        this.messagesQueue = [];
        this.workerUrl = '';
        this.scripts = [];
        this.name = name || EasyWebWorkerFixtures_1.generatedId();
        this.scripts = scripts;
        this.worker = this.createWorker();
    }
    RemoveMessageFromQueue(messageId) {
        this.messagesQueue = this.messagesQueue.filter(({ messageId: key }) => key !== messageId);
    }
    executeMessageCallback(event) {
        // eslint-disable-next-line max-len
        const message = this.messagesQueue.find(({ messageId: key }) => key === event.data.messageId);
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
    createWorker() {
        this.workerUrl = EasyWebWorkerFactory_1.default.blobWorker(this.workerBody, this.scripts);
        const worker = new Worker(this.workerUrl, {
            name: this.name,
        });
        worker.onmessage = (event) => this.executeMessageCallback(event);
        worker.onerror = (error) => this.executeMessageCallback({ data: { error } });
        return worker;
    }
    /**
    * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
    */
    cancelAll() {
        this.messagesQueue.forEach((message) => message.cancel());
        this.messagesQueue = [];
    }
    /**
    * Send a message to the worker queue
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    send(...payload) {
        var _a;
        const [_payload] = payload;
        const message = new EasyWebWorkerMessage_1.default(_payload);
        const { messageId } = message;
        this.messagesQueue.push(message);
        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage({
            messageId,
            payload: _payload,
        });
        const result = message.promise;
        result.onProgress = (callback) => {
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
    override(...payload) {
        this.cancelAll();
        return this.send(...payload);
    }
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {IMessagePromise<IResult>} generated defer that will be resolved when the message completed
    */
    overrideAfterCurrent(...payload) {
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
    dispose() {
        var _a;
        this.cancelAll();
        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.terminate();
        URL.revokeObjectURL(this.workerUrl);
        this.worker = null;
    }
}
exports.default = EasyWebWorker;
