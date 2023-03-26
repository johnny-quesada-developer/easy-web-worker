import { IEasyWebWorkerMessage } from '../src/EasyWebWorker';
import { StaticEasyWebWorker, WorkerMessage } from '../src/StaticEasyWebWorker';

describe('StaticEasyWebWorker', () => {
  let workerSelf: any;

  describe('constructor', () => {
    beforeEach(() => {
      workerSelf = {};
      jest
        .spyOn(StaticEasyWebWorker.prototype, 'defineOnMessage')
        .mockImplementation((messageTargetOrigin: string) => {
          workerSelf.onmessage = (event: MessageEvent<any>) => {
            const { messageId, payload } = event.data;

            const message = new WorkerMessage<any, any>(
              payload,
              messageId,
              messageTargetOrigin
            );

            (this as unknown as StaticEasyWebWorker).onMessageCallback.call(
              this,
              message,
              event
            );
          };
        });
    });

    it('properties should be correctly populated', () => {
      const workerBody = jest.fn(
        (message: IEasyWebWorkerMessage<string, string>) =>
          message.resolve(message.payload)
      );

      const worker = new StaticEasyWebWorker<string, string>(workerBody);

      expect(worker.onMessageCallback).toEqual(workerBody);
    });
  });
});
