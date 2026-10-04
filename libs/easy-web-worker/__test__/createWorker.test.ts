import { EasyWebWorker } from 'easy-web-worker';
import { unwrap, createWorker } from 'easy-web-worker/createWorker';

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

    const fromBody = createWorker<TestMethods>((easyWorker) => {
      easyWorker.onMessage('hello', (message) => message.resolve());
    });

    expect(unwrap(fromInstance).workers).toEqual([nativeWorker]);
    expect(unwrap(fromCollection).workers).toEqual([nativeWorker]);
    expect(unwrap(fromUrl).workerUrl).toBeInstanceOf(URL);
    expect(String(unwrap(fromBody).workerUrl)).toContain('data:');
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
