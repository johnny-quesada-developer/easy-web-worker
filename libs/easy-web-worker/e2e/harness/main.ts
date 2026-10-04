import * as easyWebWorker from 'easy-web-worker';

export type Settled =
  | { status: 'resolved'; value: unknown }
  | { status: 'rejected'; reason: unknown }
  | { status: 'timeout' };

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * Never rejects, describes how the promise ended
 */
const settle = (promise: PromiseLike<unknown>): Promise<Settled> =>
  Promise.resolve(promise).then(
    (value): Settled => ({ status: 'resolved', value }),
    (reason): Settled => ({ status: 'rejected', reason })
  );

/**
 * Same as settle, but reports a timeout if the promise is still pending after the given time
 */
const settleWithin = (
  promise: PromiseLike<unknown>,
  milliseconds: number
): Promise<Settled> =>
  Promise.race([
    settle(promise),
    wait(milliseconds).then((): Settled => ({ status: 'timeout' })),
  ]);

/**
 * Errors are not serializable between the page and the test, this keeps what the specs assert
 */
const describeError = (error: unknown) => {
  if (error instanceof Error) {
    return { isError: true, name: error.name, message: error.message };
  }

  return { isError: false, value: error };
};

const e2e = {
  wait,
  settle,
  settleWithin,
  describeError,
  staticWorkerUrl: `${location.origin}/static.worker.js`,
  defineWorkerUrl: `${location.origin}/define.worker.js`,
  scriptUrl: (name: string) => `${location.origin}/scripts/${name}.js`,
};

export type E2E = typeof e2e;

Object.assign(window, { easyWebWorker, e2e });
