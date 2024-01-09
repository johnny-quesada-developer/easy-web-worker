import {
  EasyWebWorker,
  EasyWebWorkerBody,
  IWorkerConfig,
} from './EasyWebWorker';

export const createEasyWebWorker = <TPayload = null, TResult = void>(
  source:
    | EasyWebWorkerBody<TPayload, TResult>
    | EasyWebWorkerBody<TPayload, TResult>[]
    | string
    | Worker
    | Worker[],
  /**
   * You could import scripts into your worker, this is useful if you want to use external libraries
   */
  parameters: Partial<IWorkerConfig> = {}
) => {
  return new EasyWebWorker(source, parameters);
};
