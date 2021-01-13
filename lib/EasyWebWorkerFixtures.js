"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerTemplate = exports.generatedId = void 0;
const generatedId = () => `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`;
exports.generatedId = generatedId;
const WorkerTemplate = (self) => {
    const easyWorker = new (class {
        constructor() {
            this.onMessageCallback = () => {
                // eslint-disable-next-line no-throw-literal
                throw 'you didnt defined a message-callback, please assign a callback by calling IEasyWorkerInstance.onMessage';
            };
            this.onMessage = (callback) => {
                this.onMessageCallback = callback;
            };
        }
    })();
    // eslint-disable-next-line no-param-reassign
    self.onmessage = (event) => {
        const { messageId, payload } = event.data;
        // each message should have his own resolution methods
        const message = new (class {
            constructor() {
                this.payload = payload;
                this.messageId = messageId;
                this.resolve = (...result) => self.postMessage({ messageId, payload: result });
                this.reject = (error) => this.resolve({ error });
                this.reportProgress = (progressPercentage) => self.postMessage({ messageId, progressPercentage });
            }
        })();
        easyWorker.onMessageCallback(message, event);
    };
};
exports.WorkerTemplate = WorkerTemplate;
exports.default = exports.generatedId;
