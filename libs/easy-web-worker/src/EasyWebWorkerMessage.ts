import type { CancelablePromise, DeferredPromise } from 'easy-cancelable-promise';
import { defer } from 'easy-cancelable-promise/defer';
import { uniqueId } from './uniqueId';

/**
 * This class represents a message that will be send to a worker
 */
export class EasyWebWorkerMessage<TPayload = null, TResult = void> {
  /**
   * This is the message id, it's generated automatically
   */
  public readonly messageId: string;

  /**
   * When present, this means that the message was resolved
   */
  public readonly resolved?: { payload: [TPayload?] };

  /**
   * When present, this means that the message was rejected
   * */
  public readonly rejected?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  public readonly canceled?: { reason: unknown };

  /**
   * Decoupled promise that will be resolved when the message is completed
   * The decoupled promise is a promise that can be resolved, rejected or canceled from outside
   */
  public readonly decoupledPromise: DeferredPromise<TResult> & {
    _cancel?: (reason?: unknown) => CancelablePromise<TResult>;
  };

  constructor() {
    this.messageId = uniqueId('ms:');

    this.decoupledPromise = defer<TResult>();
    // cancel is a method of the promise, it needs to stay bound to it once the promise cancel is replaced
    this.decoupledPromise._cancel = this.decoupledPromise.promise.cancel.bind(
      this.decoupledPromise.promise
    );
  }
}

export default EasyWebWorkerMessage;
