import { generatedId } from './EasyWebWorkerFixtures';
import * as IEasyWebWorker from './EasyWebWorkerTypes';

class EasyWebWorkerMessage<IPayload = null, IResult = void> implements IEasyWebWorker.IEasyWebWorkerMessage<IPayload, IResult> {

  public messageId: string;

  public wasCompleted = false;

  public wasCanceled = false;

  public promise: Promise<IResult>;

  public resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;

  public reject: (reason: Error) => void;

  public reportProgress: IEasyWebWorker.OnProgressCallback = () => {
    throw new Error('Message should receive a progress-callback in order to be able to report... send(..).onProgressCallback');
  }

  constructor(public payload: IPayload) {
    this.messageId = generatedId();
    const { promise, resolve, reject } = this.createPromise();

    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
  }

  protected createPromise(): {
    promise: Promise<IResult>,
    resolve: (...args: IResult extends void ? [null?] : [IResult]) => void,
    reject: (reason: Error) => void
    } {

    let resolve: (...args: IResult extends void ? [null?] : [IResult]) => void = () => {};
    let reject: (reason: Error) => void = () => {};

    const promise = new Promise<IResult>((_resolve, _reject) => {
      resolve = _resolve as any;
      reject = _reject;
    });

    return {
      promise, reject, resolve,
    };
  }

  public cancel() {
    this.wasCanceled = true;
  }

}

export default EasyWebWorkerMessage;
