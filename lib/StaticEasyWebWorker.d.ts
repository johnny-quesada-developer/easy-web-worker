import * as IEasyWebWorker from './EasyWebWorkerTypes';
export declare class WorkerMessage<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult> {
    payload: IPayload;
    messageId: string;
    protected messageTargetOrigin: string;
    constructor(payload: IPayload, messageId: string, messageTargetOrigin?: string);
    resolve: (...result: [null?] | [any]) => void;
    reject: (error: string | Error) => void;
    reportProgress: (progressPercentage: number) => void;
}
export declare class StaticEasyWebWorker<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWorkerInstance<IPayload, IResult> {
    onMessageCallback: (message: IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>) => void;
    constructor(onMessageCallback: (message: IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>) => void, messageTargetOrigin?: string);
    defineOnMessage: (messageTargetOrigin: string) => void;
    onMessage: (callback: (message: IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult>, event: MessageEvent<IEasyWebWorker.IMessageData<IPayload>>) => void) => void;
}
export default StaticEasyWebWorker;
//# sourceMappingURL=StaticEasyWebWorker.d.ts.map