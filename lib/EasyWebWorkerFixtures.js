"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerTemplate = exports.generatedId = void 0;
const generatedId = () => `${new Date().getTime()}${Math.random().toString(36)
    .substr(2, 9)}`;
exports.generatedId = generatedId;
const WorkerTemplate = (self) => {
    const easyWorker = new (class {
        constructor() {
            this.messageId = null;
            this.onMessageCallback = () => {
                // eslint-disable-next-line no-throw-literal
                throw 'you didnt defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage';
            };
            this.onMessage = (callback) => {
                this.onMessageCallback = callback;
            };
            this.resolve = (...payload) => self.postMessage({ messageId: this.messageId, payload });
            this.reportProgress = (progressPercentage) => self.postMessage({ messageId: this.messageId, progressPercentage });
            this.reject = (error) => this.resolve({ error });
        }
    })();
    // eslint-disable-next-line no-param-reassign
    self.onmessage = (event) => {
        const { messageId, payload } = event.data;
        easyWorker.messageId = messageId;
        easyWorker.onMessageCallback(payload[0], event);
    };
};
exports.WorkerTemplate = WorkerTemplate;
exports.default = exports.generatedId;
