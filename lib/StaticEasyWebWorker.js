"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticEasyWebWorker = exports.WorkerMessage = void 0;
class WorkerMessage {
    constructor(payload, messageId, messageTargetOrigin = '*') {
        this.payload = payload;
        this.messageId = messageId;
        this.messageTargetOrigin = messageTargetOrigin;
    }
    resolve(...result) {
        self.postMessage({ messageId: this.messageId, payload: result }, this.messageTargetOrigin);
    }
    reject(error) {
        this.resolve({ error });
    }
    reportProgress(progressPercentage) {
        self.postMessage({ messageId: this.messageId, progressPercentage }, this.messageTargetOrigin);
    }
}
exports.WorkerMessage = WorkerMessage;
class StaticEasyWebWorker {
    constructor(onMessageCallback, messageTargetOrigin = '*') {
        this.onMessageCallback = onMessageCallback;
        this.defineOnMessage(messageTargetOrigin);
    }
    defineOnMessage(messageTargetOrigin) {
        self.onmessage = (event) => {
            const { messageId, payload } = event.data;
            // each message should have his own resolution methods
            const message = new WorkerMessage(payload, messageId, messageTargetOrigin);
            this.onMessageCallback.call(this, message, event);
        };
    }
    onMessage(callback) {
        this.onMessageCallback = callback;
    }
    ;
}
exports.StaticEasyWebWorker = StaticEasyWebWorker;
exports.default = StaticEasyWebWorker;
