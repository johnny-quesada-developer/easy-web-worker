import { EasyWebWorker } from 'easy-web-worker';
import { EasyWebWorkerBody } from 'easy-web-worker/types';

/**
 * EasyWebWorker.test.ts runs real worker threads.
 * Here the Worker is a fake, so the pool, the life cycle and the error paths can be asserted without timing.
 */
class FakeWorker {
  public static instances: FakeWorker[] = [];

  public name: string;

  public onmessage: (event: { data: any }) => void = null;

  public onerror: (reason: unknown) => void = null;

  public postMessage = vi.fn();

  public terminate = vi.fn();

  constructor(
    public url?: unknown,
    options?: { name?: string }
  ) {
    this.name = options?.name;

    FakeWorker.instances.push(this);
  }

  /**
   * Messages received from the main thread
   */
  public get received(): any[] {
    return this.postMessage.mock.calls.map(([data]) => data);
  }

  /**
   * Simulates a message posted from the worker
   */
  public reply(data: Record<string, unknown>) {
    this.onmessage({ data });
  }
}

const workerBody: EasyWebWorkerBody<any, any> = (easyWorker) => {
  easyWorker.onMessage((message) => {
    message.resolve();
  });
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

describe('EasyWebWorker (pool and life cycle)', () => {
  const globalAny: any = globalThis;

  const createFakeWorker = () => new FakeWorker() as unknown as Worker;

  beforeEach(() => {
    FakeWorker.instances = [];

    globalAny.Worker = FakeWorker;
  });

  describe('configuration', () => {
    it('should warm up a single worker by default', () => {
      const worker = new EasyWebWorker(workerBody);

      expect(FakeWorker.instances.length).toEqual(1);
      expect(worker.worker).toBe(FakeWorker.instances[0]);
      expect(worker.config.maxWorkers).toEqual(1);
      expect(worker.config.warmUpWorkers).toEqual(true);
      expect(worker.config.keepAlive).toEqual(true);
      expect(worker.config.terminationDelay).toEqual(1000);
    });

    it('should use a generated name when there is no name', () => {
      const worker = new EasyWebWorker(workerBody);

      expect(typeof worker.name).toEqual('string');
      expect(worker.name.startsWith('wk:')).toEqual(true);
      expect(FakeWorker.instances[0].name).toEqual(worker.name);
    });

    it('should not create workers until needed when warmUpWorkers is false', () => {
      const worker = new EasyWebWorker(workerBody, { warmUpWorkers: false });

      expect(FakeWorker.instances.length).toEqual(0);
      expect(worker.config.keepAlive).toEqual(false);

      worker.send();

      expect(FakeWorker.instances.length).toEqual(1);
    });

    it('should respect keepAlive when is explicitly defined', () => {
      const worker = new EasyWebWorker(workerBody, {
        warmUpWorkers: false,
        keepAlive: true,
      });

      expect(worker.config.warmUpWorkers).toEqual(false);
      expect(worker.config.keepAlive).toEqual(true);
    });

    it('should accept a null configuration', () => {
      const worker = new EasyWebWorker(workerBody, null);

      expect(worker.config.maxWorkers).toEqual(1);
      expect(FakeWorker.instances.length).toEqual(1);
    });

    it('should use an external file as the worker source', () => {
      const worker = new EasyWebWorker('./worker.js');

      expect(worker.workerUrl).toEqual('./worker.js');
      expect(FakeWorker.instances[0].url).toEqual('./worker.js');
    });
  });

  describe('workers pool', () => {
    it('should not warm up the workers by default when there are multiple workers', () => {
      const worker = new EasyWebWorker(workerBody, { maxWorkers: 3 });

      expect(FakeWorker.instances.length).toEqual(0);
      expect(worker.config.warmUpWorkers).toEqual(false);
      expect(worker.config.keepAlive).toEqual(false);
    });

    it('should warm up all the workers when warmUpWorkers is true', () => {
      const worker = new EasyWebWorker(workerBody, {
        maxWorkers: 3,
        warmUpWorkers: true,
      });

      expect(FakeWorker.instances.length).toEqual(3);
      expect(worker.workers.length).toEqual(3);
      expect(worker.config.keepAlive).toEqual(true);
    });

    it('should create workers on demand until reach the maximum', () => {
      const worker = new EasyWebWorker(workerBody, { maxWorkers: 3 });

      worker.send();
      expect(FakeWorker.instances.length).toEqual(1);

      worker.send();
      expect(FakeWorker.instances.length).toEqual(2);

      worker.send();
      expect(FakeWorker.instances.length).toEqual(3);

      worker.send();
      expect(FakeWorker.instances.length).toEqual(3);
    });

    it('should rotate the messages between the workers', () => {
      const worker = new EasyWebWorker(workerBody, {
        maxWorkers: 2,
        warmUpWorkers: true,
      });

      const [worker1, worker2] = FakeWorker.instances;

      worker.send();
      worker.send();
      worker.send();

      expect(worker1.postMessage).toHaveBeenCalledTimes(2);
      expect(worker2.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should give a different name to each worker', async () => {
      const worker = new EasyWebWorker(workerBody, {
        maxWorkers: 3,
        warmUpWorkers: true,
        workerOptions: { name: 'pool' },
      });

      const names = () => FakeWorker.instances.map(({ name }) => name);

      expect(names()).toEqual(['pool', 'pool-1', 'pool-2']);
      expect(worker.config.workerOptions.name).toEqual('pool');

      await worker.reboot();

      // the new workers start from the same name
      expect(names().slice(3)).toEqual(['pool', 'pool-1', 'pool-2']);
    });

    it('should not expose a single worker when there are multiple workers', () => {
      const worker = new EasyWebWorker(workerBody, {
        maxWorkers: 2,
        warmUpWorkers: true,
      });

      expect(worker.worker).toEqual(null);
    });
  });

  describe('worker instances as source', () => {
    it('should use the worker instance', async () => {
      const source = createFakeWorker();

      const worker = new EasyWebWorker<null, string>(source);

      expect(worker.workerUrl).toEqual(null);
      expect(worker.workers).toEqual([source]);
      expect(worker.config.keepAlive).toEqual(true);

      // no extra workers should be created
      expect(FakeWorker.instances.length).toEqual(1);

      const promise = worker.send();
      const [fakeWorker] = FakeWorker.instances;
      const [{ messageId }] = fakeWorker.received;

      fakeWorker.reply({ messageId, resolved: { payload: ['result'] } });

      expect(await promise).toEqual('result');
    });

    it('should not allow to reboot a worker instance', () => {
      const worker = new EasyWebWorker(createFakeWorker());

      expect(() => worker.reboot()).toThrow(
        'You can not reboot a worker that was created from a Worker Instance'
      );
    });

    it('should use the workers collection', async () => {
      const source = [createFakeWorker(), createFakeWorker()];

      const worker = new EasyWebWorker<null, string>(source, {
        keepAlive: false,
        maxWorkers: 10,
      });

      const [worker1, worker2] = FakeWorker.instances;

      expect(worker.workerUrl).toEqual(null);
      expect(worker.workers.length).toEqual(2);
      expect(worker.config.maxWorkers).toEqual(2);

      // static workers are never terminated
      expect(worker.config.keepAlive).toEqual(true);

      const promise1 = worker.send();
      const promise2 = worker.send();

      // no extra workers should be created
      expect(FakeWorker.instances.length).toEqual(2);
      expect(worker1.postMessage).toHaveBeenCalledTimes(1);
      expect(worker2.postMessage).toHaveBeenCalledTimes(1);

      worker1.reply({
        messageId: worker1.received[0].messageId,
        resolved: { payload: ['result1'] },
      });

      worker2.reply({
        messageId: worker2.received[0].messageId,
        resolved: { payload: ['result2'] },
      });

      expect(await promise1).toEqual('result1');
      expect(await promise2).toEqual('result2');
    });

    it('should dispose a worker instance without revoking any url', async () => {
      const revokeObjectURL = vi.spyOn(globalAny.window.URL, 'revokeObjectURL');

      const worker = new EasyWebWorker(createFakeWorker());
      const [fakeWorker] = FakeWorker.instances;

      await worker.dispose();

      expect(revokeObjectURL).not.toHaveBeenCalled();
      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(worker.workers.length).toEqual(0);
    });
  });

  describe('worker messages', () => {
    it('should send the message to the worker', () => {
      const worker = new EasyWebWorker<string, void>(workerBody);
      const transfer = [new ArrayBuffer(8)];

      worker.send('payload', transfer);

      const [fakeWorker] = FakeWorker.instances;
      const [data, receivedTransfer] = fakeWorker.postMessage.mock.calls[0];

      expect(typeof data.messageId).toEqual('string');
      expect(data.__is_easy_web_worker_message__).toEqual(true);
      expect(data.method).toEqual(undefined);
      expect(data.execution).toEqual({ payload: 'payload' });
      expect(receivedTransfer).toBe(transfer);
    });

    it('should send the method name to the worker', () => {
      const worker = new EasyWebWorker(workerBody);

      worker.sendToMethod('doSomething', 'payload');

      const [fakeWorker] = FakeWorker.instances;
      const [data] = fakeWorker.received;

      expect(data.method).toEqual('doSomething');
      expect(data.execution).toEqual({ payload: 'payload' });
    });

    it('should resolve without a result when the worker sends no payload', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: {},
      });

      expect(await promise).toEqual(undefined);
    });

    it('should reject the message when the worker rejects it', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        rejected: { reason: 'reason' },
      });

      await expect(promise).rejects.toEqual('reason');
    });

    it('should ignore the messages that are not in the queue', async () => {
      const worker = new EasyWebWorker<null, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();
      const [{ messageId }] = fakeWorker.received;

      fakeWorker.reply({ messageId: 'unknown', resolved: { payload: [1] } });
      fakeWorker.reply({ messageId, resolved: { payload: ['first'] } });

      // the message was already removed from the queue
      fakeWorker.reply({ messageId, resolved: { payload: ['second'] } });

      expect(await promise).toEqual('first');
    });

    it('should request the cancelation to the worker', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      const message = worker.sendToMethod('doSomething');
      const promise = message.catch(errorLogger);

      message.cancel('reason');

      const [execution, cancelation] = fakeWorker.received;

      expect(cancelation.messageId).toEqual(execution.messageId);
      expect(cancelation.method).toEqual('doSomething');
      expect(cancelation.cancelation).toEqual({ reason: 'reason' });

      // the promise is not canceled until the worker confirms the cancelation
      expect(errorLogger).not.toHaveBeenCalled();

      fakeWorker.reply({
        messageId: execution.messageId,
        worker_cancelation: { reason: 'reason' },
      });

      await promise;

      expect(errorLogger).toHaveBeenCalledWith('reason');
    });
  });

  describe('message cancelation', () => {
    const getQueueSize = (worker: unknown) =>
      (worker as { messagesQueue: Map<string, unknown> }).messagesQueue.size;

    it('should only request the cancelation once', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      const message = worker.send();
      const promise = message.catch(errorLogger);

      expect(message.cancel('first')).toBe(message);
      expect(message.cancel('second')).toBe(message);

      // the message and a single cancelation
      expect(fakeWorker.received.length).toEqual(2);

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        worker_cancelation: { reason: 'first' },
      });

      await promise;

      // already canceled
      message.cancel('third');

      expect(fakeWorker.received.length).toEqual(2);
      expect(errorLogger).toHaveBeenCalledTimes(1);
      expect(errorLogger).toHaveBeenCalledWith('first');
    });

    it('should do nothing when the message was already completed', async () => {
      const worker = new EasyWebWorker<null, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      const message = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: { payload: ['result'] },
      });

      expect(await message).toEqual('result');
      expect(message.cancel('late')).toBe(message);
      expect(await message).toEqual('result');

      // only the message, no cancelation
      expect(fakeWorker.received.length).toEqual(1);
    });

    it('should not send the transferable objects again', () => {
      const worker = new EasyWebWorker<ArrayBuffer, void>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const buffer = new ArrayBuffer(8);

      const message = worker.send(buffer, [buffer]);

      message.catch(() => {});
      message.cancel('reason');

      const [execution, cancelation] = fakeWorker.postMessage.mock.calls;

      expect(execution[1]).toEqual([buffer]);
      expect(cancelation.length).toEqual(1);
    });

    it('should remove from the queue a message that could not be sent', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const postError = new Error('the payload could not be cloned');

      fakeWorker.postMessage.mockImplementationOnce(() => {
        throw postError;
      });

      expect(() => worker.send()).toThrow(postError);
      expect(getQueueSize(worker)).toEqual(0);

      // there is nothing to wait for
      await worker.cancelAll();

      expect(fakeWorker.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should clean the queue on reboot', async () => {
      const worker = new EasyWebWorker(workerBody);
      const errorLogger = vi.fn();

      const promises = [
        worker.send().catch(errorLogger),
        worker.send().catch(errorLogger),
      ];

      expect(getQueueSize(worker)).toEqual(2);

      await worker.reboot('reason');
      await Promise.all(promises);

      expect(getQueueSize(worker)).toEqual(0);
      expect(errorLogger).toHaveBeenCalledTimes(2);
    });

    it('should cancel on reboot a message that was waiting for the worker cancelation', async () => {
      const worker = new EasyWebWorker(workerBody);
      const errorLogger = vi.fn();

      const message = worker.send();
      const promise = message.catch(errorLogger);

      // the terminated worker will never confirm this cancelation
      message.cancel('first');

      await worker.reboot('reboot');
      await promise;

      expect(errorLogger).toHaveBeenCalledWith('reboot');
      expect(getQueueSize(worker)).toEqual(0);
    });
  });

  describe('worker errors', () => {
    it('should execute onWorkerError when the worker throws', () => {
      const onWorkerError = vi.fn();
      const error = new Error('worker error');

      new EasyWebWorker(workerBody, { onWorkerError });

      const [fakeWorker] = FakeWorker.instances;

      fakeWorker.onerror(error);

      expect(onWorkerError).toHaveBeenCalledTimes(1);
      expect(onWorkerError).toHaveBeenCalledWith(error);
    });

    it('should throw the worker error when there is no onWorkerError', () => {
      new EasyWebWorker(workerBody);

      const [fakeWorker] = FakeWorker.instances;

      expect(() => fakeWorker.onerror(new Error('worker error'))).toThrow(
        'worker error'
      );
    });
  });

  describe('keepAlive', () => {
    it('should terminate the workers after the termination delay', async () => {
      const worker = new EasyWebWorker(workerBody, {
        keepAlive: false,
        terminationDelay: 5,
      });

      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: {},
      });

      await promise;

      expect(fakeWorker.terminate).not.toHaveBeenCalled();

      await wait(30);

      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(worker.workers.length).toEqual(0);
    });

    it('should create a new worker after the termination', async () => {
      const worker = new EasyWebWorker(workerBody, {
        keepAlive: false,
        terminationDelay: 5,
      });

      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: {},
      });

      await promise;
      await wait(30);

      worker.send();

      expect(FakeWorker.instances.length).toEqual(2);
      expect(worker.workers).toEqual([FakeWorker.instances[1]]);
    });

    it('should not terminate the workers while there are messages in the queue', async () => {
      const worker = new EasyWebWorker(workerBody, {
        keepAlive: false,
        terminationDelay: 5,
      });

      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: {},
      });

      await promise;
      await wait(30);

      expect(fakeWorker.terminate).not.toHaveBeenCalled();
      expect(worker.workers.length).toEqual(1);
    });

    it.each([
      ['rejected', { rejected: { reason: 'reason' } }],
      ['canceled', { worker_cancelation: { reason: 'reason' } }],
    ])(
      'should not leak an unhandled rejection when a message is %s',
      async (_status, result) => {
        const unhandledRejection = vi.fn();

        process.on('unhandledRejection', unhandledRejection);

        try {
          const worker = new EasyWebWorker(workerBody, {
            keepAlive: false,
            terminationDelay: 5,
          });

          const [fakeWorker] = FakeWorker.instances;
          const errorLogger = vi.fn();

          const promise = worker.send().catch(errorLogger);

          fakeWorker.reply({
            messageId: fakeWorker.received[0].messageId,
            ...result,
          });

          await promise;
          await wait(30);

          expect(errorLogger).toHaveBeenCalledWith('reason');
          expect(unhandledRejection).not.toHaveBeenCalled();

          // the workers are still terminated
          expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
          expect(worker.workers.length).toEqual(0);
        } finally {
          process.off('unhandledRejection', unhandledRejection);
        }
      }
    );

    it('should not terminate the workers when keepAlive is true', async () => {
      const worker = new EasyWebWorker(workerBody, { terminationDelay: 5 });
      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.send();

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        resolved: {},
      });

      await promise;
      await wait(30);

      expect(fakeWorker.terminate).not.toHaveBeenCalled();
    });
  });

  describe('reboot', () => {
    it('should terminate the workers and cancel the messages', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      const promise = worker.send().catch(errorLogger);

      await worker.reboot('reason');
      await promise;

      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(errorLogger).toHaveBeenCalledWith('reason');

      // the canceled message is not sent to the terminated worker
      expect(fakeWorker.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should use a default reason', async () => {
      const worker = new EasyWebWorker(workerBody);
      const errorLogger = vi.fn();

      const promise = worker.send().catch(errorLogger);

      await worker.reboot();
      await promise;

      expect(errorLogger).toHaveBeenCalledWith('Worker was rebooted');
    });

    it('should warm up a new worker', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      await worker.reboot();

      expect(FakeWorker.instances.length).toEqual(2);
      expect(worker.workers).toEqual([FakeWorker.instances[1]]);
      expect(worker.workers[0]).not.toBe(fakeWorker);
    });

    it('should ignore the messages of the terminated workers', async () => {
      const worker = new EasyWebWorker<null, string>(workerBody, {
        maxWorkers: 2,
        keepAlive: true,
      });

      const callback = vi.fn();
      const errorLogger = vi.fn();

      const promise = worker.send().then(callback).catch(errorLogger);

      const [fakeWorker] = FakeWorker.instances;
      const [{ messageId }] = fakeWorker.received;

      await worker.reboot('reason');
      await promise;

      // workers are not warmed up by default when there are multiple workers
      expect(worker.workers.length).toEqual(0);

      fakeWorker.reply({ messageId, resolved: { payload: ['late result'] } });

      expect(callback).not.toHaveBeenCalled();
      expect(errorLogger).toHaveBeenCalledTimes(1);
      expect(errorLogger).toHaveBeenCalledWith('reason');
    });
  });

  describe('cancelAll', () => {
    it('should request the cancelation of every message to the worker', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();
      const progressLogger = vi.fn();

      worker.send().catch(errorLogger);
      worker.send().catch(errorLogger);

      const cancelAllPromise = worker
        .cancelAll('reason')
        .onProgress(progressLogger);

      const [execution1, execution2, cancelation1, cancelation2] =
        fakeWorker.received;

      expect(cancelation1.messageId).toEqual(execution1.messageId);
      expect(cancelation1.cancelation).toEqual({ reason: 'reason' });
      expect(cancelation2.messageId).toEqual(execution2.messageId);

      [execution1, execution2].forEach(({ messageId }) => {
        fakeWorker.reply({
          messageId,
          worker_cancelation: { reason: 'reason' },
        });
      });

      expect(await cancelAllPromise).toEqual(undefined);
      expect(errorLogger).toHaveBeenCalledTimes(2);
      expect(progressLogger).toHaveBeenCalledTimes(2);
      expect(progressLogger).toHaveBeenCalledWith(50, 'reason');

      // the workers are not terminated
      expect(fakeWorker.terminate).not.toHaveBeenCalled();
    });

    it('should reject with the reason when cancelAll itself is canceled, the messages stay canceled', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const callback = vi.fn();
      const errorLogger = vi.fn();
      const messageLogger = vi.fn();

      const message = worker.send().catch(messageLogger);

      const cancelAllPromise = worker.cancelAll('reason');
      const promise = cancelAllPromise.then(callback).catch(errorLogger);

      // the execution and its cancelation were already sent to the worker
      expect(fakeWorker.received.length).toEqual(2);

      cancelAllPromise.cancel('canceled');

      await promise;

      expect(callback).not.toHaveBeenCalled();
      expect(errorLogger).toHaveBeenCalledWith('canceled');

      // the worker still confirms the cancelation of the message
      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        worker_cancelation: { reason: 'reason' },
      });

      await message;

      expect(messageLogger).toHaveBeenCalledWith('reason');

      // canceling cancelAll sends nothing else to the worker
      expect(fakeWorker.received.length).toEqual(2);
    });

    it('should resolve when there are no messages', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      expect(await worker.cancelAll()).toEqual(undefined);

      expect(fakeWorker.postMessage).not.toHaveBeenCalled();
      expect(fakeWorker.terminate).not.toHaveBeenCalled();
    });

    it('should resolve when is forced and there are no messages', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      expect(await worker.cancelAll('reason', { force: true })).toEqual(
        undefined
      );

      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(FakeWorker.instances.length).toEqual(2);
    });

    it('should reboot the workers when is forced', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      const promise = worker.send().catch(errorLogger);

      await worker.cancelAll('reason', { force: true });
      await promise;

      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(errorLogger).toHaveBeenCalledWith('reason');
      expect(FakeWorker.instances.length).toEqual(2);
    });
  });

  describe('override', () => {
    it('should send the new message after the cancelation of the previous messages', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      worker.send('first').catch(errorLogger);

      const promise = worker.override('second', 'reason');

      // the new message waits for the cancelation
      expect(fakeWorker.received.length).toEqual(2);

      fakeWorker.reply({
        messageId: fakeWorker.received[0].messageId,
        worker_cancelation: { reason: 'reason' },
      });

      await wait(0);

      const [, , execution] = fakeWorker.received;

      expect(execution.execution).toEqual({ payload: 'second' });
      expect(errorLogger).toHaveBeenCalledWith('reason');

      fakeWorker.reply({
        messageId: execution.messageId,
        resolved: { payload: ['result'] },
      });

      expect(await promise).toEqual('result');
    });

    it('should not send the new message when is canceled', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      worker.send('first').catch(() => {});

      const overridePromise = worker.override('second', 'reason');
      const promise = overridePromise.catch(errorLogger);

      overridePromise.cancel('canceled');

      await promise;
      await wait(0);

      expect(errorLogger).toHaveBeenCalledWith('canceled');

      // only the first message and its cancelation
      expect(fakeWorker.received.length).toEqual(2);
    });

    it('should reboot the workers when is forced', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      worker.send('first').catch(errorLogger);

      const promise = worker.override('second', 'reason', { force: true });

      await wait(0);

      const [, newFakeWorker] = FakeWorker.instances;

      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(errorLogger).toHaveBeenCalledWith('reason');
      expect(newFakeWorker.received[0].execution).toEqual({
        payload: 'second',
      });

      newFakeWorker.reply({
        messageId: newFakeWorker.received[0].messageId,
        resolved: { payload: ['result'] },
      });

      expect(await promise).toEqual('result');
    });
  });

  describe('overrideAfterCurrent', () => {
    it('should send the message when the queue is empty', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;

      const promise = worker.overrideAfterCurrent('payload');

      const [execution] = fakeWorker.received;

      expect(execution.execution).toEqual({ payload: 'payload' });

      fakeWorker.reply({
        messageId: execution.messageId,
        resolved: { payload: ['result'] },
      });

      expect(await promise).toEqual('result');
    });

    it('should keep the current message and cancel the rest', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const callback = vi.fn();
      const errorLogger = vi.fn();
      const progressLogger = vi.fn();

      const currentPromise = worker.send('current').then(callback);

      worker.send('next').catch(errorLogger);

      const promise = worker
        .overrideAfterCurrent('last', 'reason')
        .onProgress(progressLogger);

      const [current, next, cancelation] = fakeWorker.received;

      // only the messages after the current one are canceled
      expect(fakeWorker.received.length).toEqual(3);
      expect(cancelation.messageId).toEqual(next.messageId);
      expect(cancelation.cancelation).toEqual({ reason: 'reason' });

      fakeWorker.reply({
        messageId: next.messageId,
        worker_cancelation: { reason: 'reason' },
      });

      await wait(0);

      const [, , , last] = fakeWorker.received;

      expect(last.execution).toEqual({ payload: 'last' });
      expect(errorLogger).toHaveBeenCalledWith('reason');
      expect(progressLogger).toHaveBeenCalledWith(100, 'reason');

      fakeWorker.reply({
        messageId: current.messageId,
        resolved: { payload: ['current result'] },
      });

      fakeWorker.reply({
        messageId: last.messageId,
        resolved: { payload: ['last result'] },
      });

      await currentPromise;

      expect(callback).toHaveBeenCalledWith('current result');
      expect(await promise).toEqual('last result');
    });
  });

  describe('overrideAfterCurrent (cancelation)', () => {
    it('should not send the new message when is canceled', async () => {
      const worker = new EasyWebWorker<string, string>(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      worker.send('current').catch(() => {});
      worker.send('next').catch(() => {});

      const overridePromise = worker.overrideAfterCurrent('last', 'reason');
      const promise = overridePromise.catch(errorLogger);

      overridePromise.cancel('canceled');

      await promise;
      await wait(0);

      expect(errorLogger).toHaveBeenCalledWith('canceled');

      // the two messages and the cancelation of the second one
      expect(fakeWorker.received.length).toEqual(3);
    });
  });

  describe('dispose', () => {
    it('should revoke the url of the worker', async () => {
      const revokeObjectURL = vi.spyOn(globalAny.window.URL, 'revokeObjectURL');

      const worker = new EasyWebWorker('./worker.js');
      const [fakeWorker] = FakeWorker.instances;

      await worker.dispose();

      expect(revokeObjectURL).toHaveBeenCalledWith('./worker.js');
      expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
      expect(worker.workers.length).toEqual(0);
    });

    it('should revoke the href when the source is an URL', async () => {
      const revokeObjectURL = vi.spyOn(globalAny.window.URL, 'revokeObjectURL');
      const url = new URL('https://example.com/worker.js');

      const worker = new EasyWebWorker(url);

      await worker.dispose();

      expect(revokeObjectURL).toHaveBeenCalledWith(url.href);
    });

    it('should use webkitURL when URL is not available', async () => {
      const webkitURL = {
        createObjectURL: vi.fn(() => 'blob:worker'),
        revokeObjectURL: vi.fn(),
      };

      globalAny.window.URL = undefined;
      globalAny.window.webkitURL = webkitURL;

      try {
        const worker = new EasyWebWorker(workerBody);

        expect(worker.workerUrl).toEqual('blob:worker');

        await worker.dispose();

        expect(webkitURL.revokeObjectURL).toHaveBeenCalledWith('blob:worker');
      } finally {
        delete globalAny.window.webkitURL;
      }
    });

    it('should cancel a message directly when the workers were removed', async () => {
      const worker = new EasyWebWorker(workerBody);
      const [fakeWorker] = FakeWorker.instances;
      const errorLogger = vi.fn();

      const message = worker.send();
      const promise = message.catch(errorLogger);

      worker.workers = [];

      message.cancel('reason');

      await promise;

      expect(errorLogger).toHaveBeenCalledWith('reason');

      // there is no worker to notify
      expect(fakeWorker.postMessage).toHaveBeenCalledTimes(1);
    });
  });
});
