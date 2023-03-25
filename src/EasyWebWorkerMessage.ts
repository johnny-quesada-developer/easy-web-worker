import {
  createDecoupledPromise,
  TDecoupledCancelablePromise,
} from 'cancelable-promise-jq';
import { generatedId } from './EasyWebWorkerFixtures';
import {
  IEasyWebWorkerMessage,
  IMessagePromise,
  OnProgressCallback,
} from './EasyWebWorkerTypes';

/**
 * This class represents a message that will be send to a worker
 */
export class EasyWebWorkerMessage<IPayload = null, IResult = void>
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

  /**
   * Decoupled promise that will be resolved when the message is completed
   */
  public decoupledPromise: TDecoupledCancelablePromise<IResult> & {
    promise: IMessagePromise<IResult>;
  };

  public resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;

  public reject: (reason: unknown) => void;

  public cancel: () => void;

  public reportProgress: OnProgressCallback = () => {
    throw new Error(
      'Message should receive a progress-callback in order to be able to report... send(..).onProgressCallback'
    );
  };

  constructor(public payload: IPayload) {
    this.messageId = generatedId();

    this.decoupledPromise =
      createDecoupledPromise<IResult>() as TDecoupledCancelablePromise<IResult> & {
        promise: IMessagePromise<IResult>;
      };

    this.decoupledPromise.onCancel(() => {
      this.wasCanceled = true;
    });

    this.resolve = (...args) => {
      this.decoupledPromise.resolve(...args);
    };
    this.reject = this.decoupledPromise.reject;
    this.cancel = this.decoupledPromise.cancel;

    this.decoupledPromise.promise.onProgress = (
      callback: OnProgressCallback
    ) => {
      this.reportProgress = callback;

      return this.decoupledPromise.promise;
    };
  }
}
