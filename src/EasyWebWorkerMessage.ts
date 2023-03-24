import { generatedId } from './EasyWebWorkerFixtures';
import {
  IEasyWebWorkerMessage,
  OnProgressCallback,
} from './EasyWebWorkerTypes';

/**
 * This class represents a message that will be send to a worker
 */
class EasyWebWorkerMessage<IPayload = null, IResult = void>
  implements IEasyWebWorkerMessage<IPayload, IResult>
{
  /**
   * This is the message id, it's generated automatically
   */
  public messageId: string;

  /**
   * This flag will be true when the message was completed
   */
  public wasCompleted = false;

  /**
   * This flag will be true when the message was canceled
   */
  public wasCanceled = false;

  public promise: Promise<IResult>;

  public resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;

  public reject: (reason: unknown) => void;

  public reportProgress: OnProgressCallback = () => {
    throw new Error(
      'Message should receive a progress-callback in order to be able to report... send(..).onProgressCallback'
    );
  };

  constructor(public payload: IPayload) {
    this.messageId = generatedId();

    const { promise, resolve, reject } = this.createPromise();

    this.promise = promise;
    this.resolve = resolve;
    this.reject = reject;
  }

  protected createPromise(): {
    promise: Promise<IResult>;
    resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;
    reject: (reason: unknown) => void;
  } {
    let resolve: (
      ...args: IResult extends void ? [null?] : [IResult]
    ) => void = () => {};

    let reject: (reason: unknown) => void = () => {};

    const promise = new Promise<IResult>((_resolve, _reject) => {
      resolve = _resolve as any;
      reject = _reject;
    });

    return {
      promise,
      reject,
      resolve,
    };
  }

  public cancel() {
    this.wasCanceled = true;
  }
}

export default EasyWebWorkerMessage;
