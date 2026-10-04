import { EasyWebWorkerBody, IWorkerConfig } from './types';
import { EasyWebWorker } from './EasyWebWorker';

export const createEasyWebWorker = <TPayload = null, TResult = void>(
  source:
    | EasyWebWorkerBody<TPayload, TResult>
    | EasyWebWorkerBody<TPayload, TResult>[]
    | string
    | URL
    | Worker
    | Worker[],
  /**
   * You could import scripts into your worker, this is useful if you want to use external libraries
   */
  parameters: Partial<IWorkerConfig> = {}
) => {
  return new EasyWebWorker(source, parameters);
};

export default createEasyWebWorker;
