"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticEasyWebWorker = exports.WorkerMessage = void 0;
class WorkerMessage {
    constructor(payload, messageId, messageTargetOrigin = '*') {
        this.payload = payload;
        this.messageId = messageId;
        this.messageTargetOrigin = messageTargetOrigin;
        this.resolve = (...result) => self.postMessage({ messageId: this.messageId, payload: result }, this.messageTargetOrigin);
        this.reject = (error) => this.resolve({ error });
        this.reportProgress = (progressPercentage) => self.postMessage({ messageId: this.messageId, progressPercentage }, this.messageTargetOrigin);
    }
}
exports.WorkerMessage = WorkerMessage;
class StaticEasyWebWorker {
    constructor(onMessageCallback, messageTargetOrigin = '*') {
        this.onMessageCallback = onMessageCallback;
        this.defineOnMessage = (messageTargetOrigin) => {
            self.onmessage = (event) => {
                const { messageId, payload } = event.data;
                // each message should have his own resolution methods
                const message = new WorkerMessage(payload, messageId, messageTargetOrigin);
                this.onMessageCallback(message, event);
            };
        };
        this.onMessage = (callback) => {
            this.onMessageCallback = callback;
        };
        this.defineOnMessage(messageTargetOrigin);
    }
}
exports.StaticEasyWebWorker = StaticEasyWebWorker;
exports.default = StaticEasyWebWorker;
