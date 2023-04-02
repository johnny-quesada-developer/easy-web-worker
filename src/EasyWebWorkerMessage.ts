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
  public resolved?: { payload: [TPayload?] };

  /**
   * When present, this means that the message was rejected
   * */
  public rejected?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  public canceled?: { reason: unknown };

  /**
   * When present, this means that the message was canceled
   * */
  public worker_canceled?: { reason: unknown };

  /**
   * Decoupled promise that will be resolved when the message is completed
   * The decoupled promise is a promise that can be resolved, rejected or canceled from outside
   */
  public decoupledPromise: TDecoupledCancelablePromise<TResult>;

  constructor() {
    this.messageId = generatedId();

    this.decoupledPromise = createDecoupledPromise<TResult>();
  }
}
