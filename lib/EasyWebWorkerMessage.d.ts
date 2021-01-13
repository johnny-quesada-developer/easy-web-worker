import * as IEasyWebWorker from './EasyWebWorkerTypes';
declare class EasyWebWorkerMessage<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult> {
    payload: IPayload;
    messageId: string;
    wasCompleted: boolean;
    wasCanceled: boolean;
    promise: Promise<IResult>;
    resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
    reject: (reason: Error) => void;
    reportProgress: IEasyWebWorker.OnProgressCallback;
    constructor(payload: IPayload);
    protected createPromise(): {
        promise: Promise<IResult>;
        resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
        reject: (reason: Error) => void;
    };
    cancel(): void;
}
export default EasyWebWorkerMessage;
//# sourceMappingURL=EasyWebWorkerMessage.d.ts.map