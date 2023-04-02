import { IEasyWebWorkerMessage } from '../src/EasyWebWorker';
import { StaticEasyWebWorker } from '../src/StaticEasyWebWorker';

describe('StaticEasyWebWorker', () => {
  describe('constructor', () => {
    it('properties should be correctly populated', () => {
      expect.assertions(5);

      const workerBody = jest.fn(
        (message: IEasyWebWorkerMessage<string, string>) => {
          message.resolve(message.payload);
        }
      );

      const worker = new StaticEasyWebWorker<string, string>(workerBody);

      expect(worker.onMessage).toBeDefined();
      expect(worker.close).toBeDefined();
      expect(worker.importScripts).toBeDefined();

      const onMessage = jest.fn((message: IEasyWebWorkerMessage) => {
        expect(message.payload).toBe('hello');
      }) as any;

      worker.onMessage(onMessage);

      self.postMessage({ execution: { payload: 'hello' } });

      expect(onMessage).toHaveBeenCalled();
    });
  });
});
