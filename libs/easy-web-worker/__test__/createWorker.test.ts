import { EasyWebWorker } from 'easy-web-worker';
import { unwrap, createWorker } from 'easy-web-worker/createWorker';
import { getDefineWorkerTemplate } from 'easy-web-worker/getDefineWorkerTemplate';

class FakeWorker {
  public static instances: FakeWorker[] = [];

  public onmessage: (event: { data: any }) => void = null;

  public onerror: (reason: unknown) => void = null;

  public postMessage = vi.fn();

  public terminate = vi.fn();

  constructor(public url?: unknown, public options?: { name?: string }) {
    FakeWorker.instances.push(this);
  }

  public get received(): any[] {
    return this.postMessage.mock.calls.map(([data]) => data);
  }

  public reply(data: Record<string, unknown>) {
    this.onmessage({ data });
  }
}

type TestMethods = {
  double: (value: number) => number;
  hello: () => string;
  // names that also exist in the EasyWebWorker class
  send: (value: string) => string;
  dispose: () => string;
};

describe('createWorker (proxy)', () => {
  const globalAny: any = globalThis;

  beforeEach(() => {
    FakeWorker.instances = [];

    globalAny.Worker = FakeWorker;
  });

  it('should create an EasyWebWorker with the source and the configuration', () => {
    const worker = createWorker<TestMethods>('./worker.js', {
      maxWorkers: 2,
      warmUpWorkers: true,
      workerOptions: { name: 'proxy' },
    });

    const instance = unwrap(worker);

    expect(instance).toBeInstanceOf(EasyWebWorker);
    expect(instance.workerUrl).toEqual('./worker.js');
    expect(instance.config.maxWorkers).toEqual(2);
    expect(FakeWorker.instances.map(({ url }) => url)).toEqual([
      './worker.js',
      './worker.js',
    ]);
  });

  it('should accept the same sources as EasyWebWorker', () => {
    const nativeWorker = new FakeWorker() as unknown as Worker;

    const fromInstance = createWorker<TestMethods>(nativeWorker);
    const fromCollection = createWorker<TestMethods>([nativeWorker]);
    const fromUrl = createWorker<TestMethods>(new URL('https://example.com'));

    expect(unwrap(fromInstance).workers).toEqual([nativeWorker]);
    expect(unwrap(fromCollection).workers).toEqual([nativeWorker]);
    expect(unwrap(fromUrl).workerUrl).toBeInstanceOf(URL);
  });

  describe('function as source', () => {
    const getWorkerContent = (callback: () => unknown): string => {
      const createObjectURL = vi.spyOn(globalAny.window.URL, 'createObjectURL');

      callback();

      const [blob] = createObjectURL.mock.calls[0] as [{ content: string[] }];

      return blob.content[0];
    };

    it('should create the file of the worker from the function', () => {
      const builder = () => ({
        double: (value: number) => value * 2,
      });

      let workerUrl: unknown = null;

      const content = getWorkerContent(() => {
        workerUrl = unwrap(createWorker(builder)).workerUrl;
      });

      // the worker is created from the generated file
      expect(String(workerUrl)).toContain('data:');
      expect(FakeWorker.instances.length).toEqual(1);
      expect(FakeWorker.instances[0].url).toBe(workerUrl);

      // defineWorker is executed inside the worker with the function as builder
      expect(content).toContain(`let dw$=${getDefineWorkerTemplate()};`);
      expect(content).toContain(`\n(${builder.toString().trim()})\n`);
      expect(content.startsWith('self.primitiveParameters=JSON.parse(`[]`);')).toEqual(true);
    });

    it('should include the scripts and the primitive parameters', () => {
      const content = getWorkerContent(() => {
        createWorker(() => ({ hello: () => 'hello' }), {
          scripts: ['https://example.com/a.js', 'https://example.com/b.js'],
          primitiveParameters: [1, 'text'],
        });
      });

      expect(
        content.startsWith(
          'self.importScripts("https://example.com/a.js","https://example.com/b.js");self.primitiveParameters=JSON.parse(`[1,"text"]`);'
        )
      ).toEqual(true);
    });

    it('should reuse the file of the worker for every worker of the pool', async () => {
      const worker = createWorker(() => ({ hello: () => 'hello' }), {
        maxWorkers: 2,
        warmUpWorkers: true,
      });

      const { workerUrl } = unwrap(worker);

      await unwrap(worker).reboot();

      expect(FakeWorker.instances.length).toEqual(4);
      expect(FakeWorker.instances.every(({ url }) => url === workerUrl)).toEqual(true);
    });

    it('should revoke the file of the worker on dispose', async () => {
      const revokeObjectURL = vi.spyOn(globalAny.window.URL, 'revokeObjectURL');

      const worker = createWorker(() => ({ hello: () => 'hello' }));
      const { workerUrl } = unwrap(worker);

      await unwrap(worker).dispose();

      expect(revokeObjectURL).toHaveBeenCalledWith(String(workerUrl));
    });

    it('should create a single file from a collection of functions', () => {
      const first = () => ({ double: (value: number) => value * 2 });
      const second = () => ({ triple: (value: number) => value * 3 });

      let workerUrl: unknown = null;

      const content = getWorkerContent(() => {
        workerUrl = unwrap(createWorker([first, second])).workerUrl;
      });

      const firstIndex = content.indexOf(`(${first.toString().trim()})`);
      const secondIndex = content.indexOf(`(${second.toString().trim()})`);

      // one worker, with both functions in the order they were received
      expect(FakeWorker.instances.length).toEqual(1);
      expect(String(workerUrl)).toContain('data:');
      expect(firstIndex).toBeGreaterThan(-1);
      expect(secondIndex).toBeGreaterThan(firstIndex);
    });

    it('should keep a collection of native workers as the pool', () => {
      const workers = [new FakeWorker(), new FakeWorker()] as unknown as Worker[];

      const worker = createWorker<TestMethods>(workers);

      expect(unwrap(worker).workers).toEqual(workers);
      expect(unwrap(worker).workerUrl).toEqual(null);
    });
  });

  it('should send a message to the method of the worker', async () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const [fakeWorker] = FakeWorker.instances;

    const promise = worker.double(21);
    const [data] = fakeWorker.received;

    expect(data.method).toEqual('double');
    expect(data.execution).toEqual({ payload: 21 });
    expect(data.__is_easy_web_worker_message__).toEqual(true);

    fakeWorker.reply({ messageId: data.messageId, resolved: { payload: [42] } });

    expect(await promise).toEqual(42);
  });

  it('should send the transferable objects', () => {
    const worker = createWorker<{ load: (buffer: ArrayBuffer) => number }>(
      './worker.js'
    );

    const [fakeWorker] = FakeWorker.instances;
    const buffer = new ArrayBuffer(8);

    worker.load(buffer, [buffer]);

    const [data, transfer] = fakeWorker.postMessage.mock.calls[0];

    expect(data.execution).toEqual({ payload: buffer });
    expect(transfer).toEqual([buffer]);
  });

  it('should return a cancelable promise', async () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const [fakeWorker] = FakeWorker.instances;
    const progressLogger = vi.fn();
    const errorLogger = vi.fn();

    const message = worker.hello().onProgress(progressLogger);
    const promise = message.catch(errorLogger);
    const [{ messageId }] = fakeWorker.received;

    fakeWorker.reply({ messageId, progress: { percentage: 50, payload: 'half' } });

    expect(progressLogger).toHaveBeenCalledWith(50, 'half');

    message.cancel('reason');

    expect(fakeWorker.received[1].cancelation).toEqual({ reason: 'reason' });

    fakeWorker.reply({ messageId, worker_cancelation: { reason: 'reason' } });

    await promise;

    expect(errorLogger).toHaveBeenCalledWith('reason');
  });

  it('should send to the worker the methods named like the EasyWebWorker api', () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const [fakeWorker] = FakeWorker.instances;

    worker.send('payload');
    worker.dispose();

    expect(fakeWorker.received.map(({ method }) => method)).toEqual([
      'send',
      'dispose',
    ]);

    // the worker was not disposed
    expect(fakeWorker.terminate).not.toHaveBeenCalled();
    expect(unwrap(worker).workers.length).toEqual(1);
  });

  it('should keep the same function for each method', () => {
    const worker = createWorker<TestMethods>('./worker.js');

    expect(worker.double).toBe(worker.double);
    expect(worker.double).not.toBe(worker.hello);
  });

  it('should not be treated as a promise', async () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const [fakeWorker] = FakeWorker.instances;

    const resolved = await Promise.resolve(worker);

    expect(resolved).toBe(worker);
    expect((worker as unknown as PromiseLike<unknown>).then).toBeUndefined();
    expect(fakeWorker.postMessage).not.toHaveBeenCalled();
  });

  it('should not allow to override the methods or the worker', () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const instance = unwrap(worker);
    const writable = worker as any;

    expect(Reflect.set(writable, 'double', () => 0)).toEqual(false);
    expect(Reflect.deleteProperty(writable, 'double')).toEqual(false);

    expect(typeof worker.double).toEqual('function');
    expect(unwrap(worker)).toBe(instance);
    expect(Object.keys(worker)).toEqual([]);
    expect('double' in worker).toEqual(true);
  });

  it('should give access to the api of the EasyWebWorker', async () => {
    const worker = createWorker<TestMethods>('./worker.js');
    const [fakeWorker] = FakeWorker.instances;
    const errorLogger = vi.fn();

    const promise = worker.hello().catch(errorLogger);

    await unwrap(worker).reboot('reason');
    await promise;

    expect(errorLogger).toHaveBeenCalledWith('reason');
    expect(fakeWorker.terminate).toHaveBeenCalledTimes(1);
    expect(FakeWorker.instances.length).toEqual(2);

    await unwrap(worker).dispose();

    expect(unwrap(worker).workers.length).toEqual(0);
  });
});
