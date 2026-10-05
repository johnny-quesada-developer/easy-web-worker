import type { CancelablePromise } from 'easy-cancelable-promise/CancelablePromise';
import type {
  EasyWebWorker,
  IEasyWorkerInstance,
  IMessageData,
} from 'easy-web-worker';
import {
  defineWorker,
  unwrap as unwrapInWorker,
} from 'easy-web-worker/defineWorker';
import { createWorker, unwrap } from 'easy-web-worker/createWorker';

/**
 * This file is never executed, it only needs to compile: `yarn test:types`
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const expectType = <_T extends true>() => {};

// ---- worker file

const definition = defineWorker(({ onMessage }) => ({
  // plain functions
  hello: () => 'hello',
  double: (value: number) => value * 2,
  optional: (value?: number) => value ?? 0,
  sum: async (values: number[]) => values.length,
  nothing: () => {},

  // onMessage((payload, message) => result)
  count: onMessage(async (to: number, message) => {
    expectType<Equal<typeof message.payload, number>>();

    message.reportProgress(50, { step: 1 });
    message.onCancel(() => {});

    return `${to}`;
  }),

  noPayload: onMessage((_payload: null, message) => {
    message.reportProgress(1);

    return true;
  }),

  // the third parameter is the event
  withEvent: onMessage((value: number, _message, event) => {
    expectType<Equal<typeof event, MessageEvent<IMessageData<number>>>>();

    return event.data.messageId ?? `${value}`;
  }),

  // onMessage<TPayload, TResult>().handle((message) => { ... })
  later: onMessage<number, string>().handle((message, event) => {
    expectType<Equal<typeof message.payload, number>>();
    expectType<Equal<Parameters<typeof message.resolve>[0], string>>();
    expectType<Equal<typeof event.data.messageId, string | undefined>>();

    message.resolve('done');

    // @ts-expect-error the result of this method is a string
    message.resolve(1);
  }),

  laterWithoutPayload: onMessage<null, void>().handle((message) => {
    message.resolve();
  }),
}));

export type MyWorker = typeof definition;

expectType<
  Equal<ReturnType<typeof unwrapInWorker<MyWorker>>, IEasyWorkerInstance>
>();

unwrapInWorker(definition).importScripts('script.js');
unwrapInWorker(definition).close();

// ---- main thread

const worker = createWorker<MyWorker>(new URL('https://example.com/worker.js'));

type Caller<TPayload, TResult> = (
  payload: TPayload,
  transfer?: Transferable[]
) => CancelablePromise<TResult>;

expectType<Equal<typeof worker.hello, () => CancelablePromise<string>>>();
expectType<Equal<typeof worker.double, Caller<number, number>>>();
expectType<Equal<typeof worker.sum, Caller<number[], number>>>();
expectType<Equal<typeof worker.nothing, () => CancelablePromise<void>>>();
expectType<Equal<typeof worker.count, Caller<number, string>>>();
expectType<Equal<typeof worker.noPayload, () => CancelablePromise<boolean>>>();
expectType<Equal<typeof worker.withEvent, Caller<number, string>>>();
expectType<Equal<typeof worker.later, Caller<number, string>>>();
expectType<
  Equal<typeof worker.laterWithoutPayload, () => CancelablePromise<void>>
>();

expectType<
  Equal<
    typeof worker.optional,
    (payload?: number, transfer?: Transferable[]) => CancelablePromise<number>
  >
>();

worker
  .double(1)
  .onProgress(() => {})
  .cancel('reason');
worker.double(1, [new ArrayBuffer(1)]);

// @ts-expect-error the payload is required
worker.double();

// @ts-expect-error the payload is a number
worker.double('1');

// @ts-expect-error this method does not receive a payload
worker.hello(1);

// @ts-expect-error the worker does not have this method
worker.unknownMethod();

// the api of the EasyWebWorker is not part of the worker, it is behind unwrap
// @ts-expect-error
worker.dispose();

expectType<
  Equal<
    ReturnType<typeof unwrap<typeof worker>>,
    EasyWebWorker<unknown, unknown>
  >
>();

unwrap(worker).cancelAll('reason');
unwrap(worker).sendToMethod<number, number>('double', 1);
unwrap(worker).dispose();

// the methods can also be described without a worker definition
const described = createWorker<{ ping: (value: string) => number }>(
  'worker.js'
);

expectType<Equal<typeof described.ping, Caller<string, number>>>();

// ---- function as source: createWorker(builder)

const runtime = createWorker(
  ({ onMessage }, context) => {
    expectType<Equal<typeof context.primitiveParameters, [string, number]>>();

    return {
      double: (value: number) => value * 2,
      hello: () => 'hello',
      sum: async (values: number[]) => values.length,

      count: onMessage(async (to: number, message) => {
        message.reportProgress(50);

        return `${to}`;
      }),

      later: onMessage<number, boolean>().handle((message) => {
        message.resolve(true);
      }),
    };
  },
  {
    maxWorkers: 2,
    primitiveParameters: ['text', 1] as [string, number],
  }
);

expectType<Equal<typeof runtime.double, Caller<number, number>>>();
expectType<Equal<typeof runtime.hello, () => CancelablePromise<string>>>();
expectType<Equal<typeof runtime.sum, Caller<number[], number>>>();
expectType<Equal<typeof runtime.count, Caller<number, string>>>();
expectType<Equal<typeof runtime.later, Caller<number, boolean>>>();

// @ts-expect-error the payload is a number
runtime.double('1');

// @ts-expect-error the function does not return this method
runtime.unknownMethod();

unwrap(runtime).dispose();

// @ts-expect-error a collection of functions is not supported as source
createWorker([() => ({ hello: () => 'hello' })]);

// ---- easyWorker and the scope of the worker inside a function used as source

const mixedRuntime = createWorker(({ onMessage, easyWorker }, context) => {
  expectType<Equal<typeof easyWorker, IEasyWorkerInstance>>();

  easyWorker.onMessage<number, number>('legacy', (message) => {
    message.resolve(message.payload * 2);
  });

  easyWorker.onMessage((message) => {
    message.resolve();
  });

  easyWorker.importScripts('script.js');

  context.shared = 1;

  return {
    typed: onMessage((value: number) => value * 2),
    close: () => easyWorker.close(),
  };
});

expectType<Equal<typeof mixedRuntime.typed, Caller<number, number>>>();

// @ts-expect-error methods registered with the message api are not in the inferred type
mixedRuntime.legacy(1);

// the methods can be described when they are registered with the message api
const describedRuntime = createWorker<{ uppercase: (text: string) => string }>(
  ({ easyWorker }) => {
    easyWorker.onMessage<string, string>('uppercase', (message) => {
      message.resolve(message.payload.toUpperCase());
    });
  }
);

expectType<Equal<typeof describedRuntime.uppercase, Caller<string, string>>>();

// defineWorker only receives onMessage, the worker is reached with unwrap
defineWorker((helpers) => {
  expectType<Equal<keyof typeof helpers, 'onMessage'>>();

  return {};
});
