"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EasyWebWorkerFixtures_1 = require("./EasyWebWorkerFixtures");
class EasyWebWorkerMessage {
    constructor(payload) {
        this.payload = payload;
        this.wasCompleted = false;
        this.wasCanceled = false;
        this.reportProgress = () => {
            throw new Error('Message should receive a progress-callback in order to be able to report... send(..).onProgressCallback');
        };
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
    cancel() {
        this.wasCanceled = true;
    }
}
exports.default = EasyWebWorkerMessage;
