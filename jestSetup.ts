import { Worker } from 'node:worker_threads';
import { URL_MOCK, BLOB_MOCK, WINDOW_MOCK } from './@tests/fixtures';

export class WORKER_MOCK extends Worker {
  constructor(source: string) {
    super(source);

    this.addListener('message', (message) => {
      this.onmessage?.(message);
    });
  }

  // @ts-ignore - this is a mock of the web worker which does have origin property
  public postMessage(data: any, transfer?: any[]) {
    const event = {
      data,
    };

    super.postMessage(event, transfer);
  }

  public onmessage: (event: { data: any }) => void = () => {};

  public onerror: (event: { data: any }) => void = () => {};
}

beforeEach(() => {
  const globalAny: any = global;

  globalAny.window = WINDOW_MOCK;
  globalAny.Blob = BLOB_MOCK;
  globalAny.window.URL = URL_MOCK;
  globalAny.Worker = WORKER_MOCK;
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
