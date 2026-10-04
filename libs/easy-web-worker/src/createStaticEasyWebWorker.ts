import { IEasyWebWorkerMessage, IMessageData } from './types';
import { StaticEasyWebWorker } from './StaticEasyWebWorker';

/**
 * This method is used to create a new instance of the easy static web worker
 * @deprecated use defineWorker, the methods of the worker get typed in the main thread
 */
export const createStaticEasyWebWorker = <TPayload = null, TResult = void>(
  onMessageCallback?: (
    message: IEasyWebWorkerMessage<TPayload, TResult>,
    event: MessageEvent<IMessageData<TPayload>>
  ) => void
) => {
  const worker = new StaticEasyWebWorker(onMessageCallback);

  return worker;
};

export default createStaticEasyWebWorker;
