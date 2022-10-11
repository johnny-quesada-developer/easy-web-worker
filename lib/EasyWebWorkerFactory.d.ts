import * as IEasyWebWorker from "./EasyWebWorkerTypes";
export declare class EasyWebWorkerFactory {
    private getImportScriptsTemplate;
    blob(source: string, imports?: string[]): string;
    blobWorker<IPayload = null, IResult = void>(source: IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult> | IEasyWebWorker.EasyWebWorkerBody<IPayload, IResult>[], imports?: string[]): string;
}
declare const _default: EasyWebWorkerFactory;
export default _default;
//# sourceMappingURL=EasyWebWorkerFactory.d.ts.map