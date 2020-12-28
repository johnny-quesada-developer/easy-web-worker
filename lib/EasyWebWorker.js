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
    constructor(workerBody, { scripts = [], name, onProgress = null, } = {}) {
        this.workerBody = workerBody;
        this.messages = {};
        this.workerUrl = '';
        this.scripts = [];
        this.name = name || EasyWebWorkerFixtures_1.generatedId();
        this.scripts = scripts;
        this.onProgress = onProgress;
        this.worker = this.createWorker();
    }
    createWorker() {
        this.workerUrl = EasyWebWorkerFactory_1.default.blobWorker(this.workerBody, this.scripts);
        const worker = new Worker(this.workerUrl, {
            name: this.name,
        });
        worker.onmessage = (event) => {
            const message = this.messages[event.data.messageId];
            if (message) {
                const { payload, error: messageError, progressPercentage } = event.data;
                const error = messageError || null;
                message.executeCallback(payload, error, this.onProgress, progressPercentage, this.worker);
            }
        };
        worker.onerror = (event) => {
            const message = this.messages[event.data.messageId];
            if (message) {
                const { payload, error: messageError, progressPercentage, messageId, } = event.data;
                const error = messageError || null;
                delete this.messages[messageId];
                message.executeCallback(payload, error, this.onProgress, progressPercentage, this.worker);
            }
        };
        return worker;
    }
    /**
    * Disable the resolve of all current WebWorkers messages, no any of the current messages gonna call onProgress callback, neither promise.resolve
    */
    cancelAll() {
        Object.keys(this.messages).forEach((key) => {
            this.messages[key].cancel();
            delete this.messages[key];
        });
    }
    /**
    * Send a message to the worker queue
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {Promise} generated defer that will be resolved when the message completed
    */
    send(...payload) {
        var _a;
        const message = new EasyWebWorkerMessage_1.default();
        const { messageId } = message;
        this.messages[messageId] = message;
        (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage({
            messageId,
            payload,
        });
        return message.promise.finally(() => {
            delete this.messages[messageId];
        });
    }
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {Promise} generated defer that will be resolved when the message completed
    */
    override(...payload) {
        this.cancelAll();
        return this.send(...payload);
    }
    /**
    * Web Workers works as a QUEUE, sometimes a new message actually would be the only message that you'll want to resolve...
    * you could use OVERRIDE to that purpose.
    * @param {IPayload} payload - whatever json data you want to send to the worker
    * @returns {Promise} generated defer that will be resolved when the message completed
    */
    overrideAfterCurrent(...payload) {
        const messages = Object.keys(this.messages);
        if (messages.length) {
            this.cancelAll();
            const [messageId] = messages;
            const message = this.messages[messageId];
            message.wasCanceled = false;
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
