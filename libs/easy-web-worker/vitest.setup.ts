import { afterEach, beforeEach, vi } from 'vitest';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { URL_MOCK, BLOB_MOCK, WINDOW_MOCK } from './__test__/fixtures';

const isDistTarget = process.env.EASY_WEB_WORKER_TEST_TARGET === 'dist';

/**
 * The worker files written in typescript are loaded with tsx,
 * its tsconfig resolves `easy-web-worker` to the source or to the built package, same switch as vitest.config.ts
 */
const typescriptWorkerOptions = {
  execArgv: ['--import', 'tsx'],
  env: {
    ...process.env,
    TSX_TSCONFIG_PATH: path.resolve(
      __dirname,
      isDistTarget ? '__test__/tsconfig.dist.json' : '__test__/tsconfig.json'
    ),
  },
};

export class WORKER_MOCK extends Worker {
  constructor(source: string | URL) {
    super(
      source,
      String(source).endsWith('.ts') ? typescriptWorkerOptions : undefined
    );

    this.addListener('message', (message) => {
      this.onmessage?.(message);
    });
  }

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
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
