import {
  TDecoupledCancelablePromise,
  createDecoupledPromise,
} from 'cancelable-promise-jq';
import { generatedId } from './EasyWebWorkerFixtures';

/**
 * This class represents a message that will be send to a worker
 */
export class EasyWebWorkerMessage<TPayload = null, TResult = void> {
  /**
   * This is the message id, it's generated automatically
   */
  public messageId: string;

  /**
   * When present, this means that the message was resolved
   */
  public resolved?: { payload: unknown[] };

  /**
   * When present, this means that the message was rejected
   * */
  public rejected?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  public canceled?: { reason: unknown };

  /**
   * Decoupled promise that will be resolved when the message is completed
   * The decoupled promise is a promise that can be resolved, rejected or canceled from outside
   */
  public decoupledPromise: TDecoupledCancelablePromise<TResult>;

  /**
   * This method will resolve the decoupled promise
   */
  public resolve?: (
    ...args: TResult extends void ? [null?] : [TResult]
  ) => void;

  /**
   * This method will reject the decoupled promise
   */
  public reject?: (reason: unknown) => void;

  /**
   * This method will cancel the decoupled promise
   */
  public cancel?: (reason: unknown) => void;

  /**
   * This method will report the progress of the message
   * @param {number} progressPercentage - This is the progress percentage
   */
  public reportProgress: (progressPercentage: number, payload: unknown) => void;

  /**
   * This is the constructor of the class
   * @param {TPayload} payload - This are the parameters included in the message
   */
  constructor(public payload: TPayload) {
    this.messageId = generatedId();

    this.decoupledPromise = createDecoupledPromise<TResult>();

    this.resolve = this.decoupledPromise.resolve;

    this.reject = this.decoupledPromise.reject;

    this.cancel = this.decoupledPromise.cancel;

    this.reportProgress = (...args) => {
      (
        this.decoupledPromise.promise.reportProgress as (
          progressPercentage: number,
          payload: unknown
        ) => void
      )(...args);
    };

    this.decoupledPromise.onCancel((reason) => {
      this.canceled = { reason };
    });
  }
}
