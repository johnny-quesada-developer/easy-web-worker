import * as IEasyWebWorker from './EasyWebWorkerTypes';
declare class EasyWebWorkerMessage<IResult = void> implements IEasyWebWorker.IEasyWebWorkerMessage<IResult> {
    messageId: string;
    wasCompleted: boolean;
    wasCanceled: boolean;
    promise: Promise<IResult>;
    protected resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
    protected reject: (reason: Error) => void;
    constructor();
    protected createPromise(): {
        promise: Promise<IResult>;
        resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
        reject: (reason: Error) => void;
    };
    executeCallback(payload: IResult extends void ? [null?] : [IResult], error: Error, onProgress: IEasyWebWorker.OnProgressCallback | null, progressPercentage: number, worker: Worker | null): void;
    cancel(): void;
}
export default EasyWebWorkerMessage;
//# sourceMappingURL=EasyWebWorkerMessage.d.ts.map