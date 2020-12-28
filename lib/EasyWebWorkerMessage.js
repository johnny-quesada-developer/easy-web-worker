"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EasyWebWorkerFixtures_1 = require("./EasyWebWorkerFixtures");
class EasyWebWorkerMessage {
    constructor() {
        this.wasCompleted = false;
        this.wasCanceled = false;
        this.messageId = EasyWebWorkerFixtures_1.generatedId();
        const { promise, resolve, reject } = this.createPromise();
        this.promise = promise;
        this.resolve = resolve;
        this.reject = reject;
    }
    createPromise() {
        let resolve = () => { };
        let reject = () => { };
        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        return {
            promise, reject, resolve,
        };
    }
    executeCallback(payload, error, onProgress, progressPercentage, worker) {
        if (!worker) {
            this.wasCompleted = true;
            return;
        }
        if (error) {
            this.reject(error);
            return;
        }
        if (this.wasCanceled) {
            this.wasCompleted = true;
            return;
        }
        if (progressPercentage !== undefined) {
            onProgress(progressPercentage);
            return;
        }
        this.resolve(...(payload || []));
    }
    cancel() {
        this.wasCanceled = true;
    }
}
exports.default = EasyWebWorkerMessage;
