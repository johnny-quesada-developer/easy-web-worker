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
   * Reason of the cancelation or rejection of the message
   */
  public reason?: unknown;

  /**
   * Decoupled promise that will be resolved when the message is completed
   * The decoupled promise is a promise that can be resolved, rejected or canceled from outside
   */
  public decoupledPromise: TDecoupledCancelablePromise<IResult> & {
    promise: IMessagePromise<IResult>;
  };

  /**
   * This method will resolve the decoupled promise
   */
  public resolve: (...args: IResult extends void ? [null?] : [IResult]) => void;

  /**
   * This method will reject the decoupled promise
   */
  public reject: (reason: unknown) => void;

  /**
   * This method will cancel the decoupled promise
   */
  public cancel: (reason: unknown) => void;

  /**
   * This method will report the progress of the message
   * @param {number} progressPercentage - This is the progress percentage
   */
  public reportProgress: OnProgressCallback = () => {
    throw new Error(
      'Message should receive a progress-callback in order to be able to report... send(..).onProgressCallback'
    );
  };

  /**
   * This is the constructor of the class
   * @param {IPayload} payload - This are the parameters included in the message
   */
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
