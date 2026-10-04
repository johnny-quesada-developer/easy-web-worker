import { unwrap, defineWorker } from 'easy-web-worker/defineWorker';

/**
 * Worker file used by the specs, same behaviors as static.worker.ts written with defineWorker.
 */
const scope = self as any;

const state = {
  counter: 0,
  canceled: 0,
  finalized: 0,
};

const worker = defineWorker(({ onMessage }) => ({
  hello: (name: string) => `Hello ${name}!`,

  name: (): string => scope.name,

  increment: () => {
    state.counter += 1;

    return state.counter;
  },

  getState: () => ({ ...state }),

  sum: async (values: number[]) => {
    await new Promise((resolve) => setTimeout(resolve, 10));

    return values.reduce((total, value) => total + value, 0);
  },

  progress: onMessage((steps: number, message) => {
    for (let step = 1; step <= steps; step++) {
      message.reportProgress((step * 100) / steps, step);
    }

    return steps;
  }),

  slow: onMessage<number, string>().handle((message) => {
    const timeoutId = setTimeout(() => message.resolve('done'), message.payload);

    message.onCancel(() => {
      state.canceled += 1;

      clearTimeout(timeoutId);
    });

    message.onFinalize(() => {
      state.finalized += 1;
    });
  }),

  slowAsync: onMessage(async (milliseconds: number, message) => {
    await new Promise<void>((resolve) => {
      const timeoutId = setTimeout(resolve, milliseconds);

      message.onCancel(() => {
        state.canceled += 1;

        clearTimeout(timeoutId);
        resolve();
      });
    });

    return 'done';
  }),

  reject: (reason: string): void => {
    throw reason;
  },

  rejectWithError: (): void => {
    throw new TypeError('worker type error');
  },

  rejectAsync: async (reason: string): Promise<void> => {
    throw new RangeError(reason);
  },

  cancelFromWorker: onMessage((reason: string, message) => {
    message.cancel(reason);
  }),

  completeTwice: onMessage<null, string>().handle((message) => {
    message.resolve('first');
    message.resolve('second');
    message.reject('third');
    message.reportProgress(50);
  }),

  transfer: onMessage<ArrayBuffer, { received: number; buffer: ArrayBuffer }>().handle(
    (message) => {
      const buffer = new ArrayBuffer(message.payload.byteLength * 2);

      message.resolve({ received: message.payload.byteLength, buffer }, [buffer]);
    }
  ),

  importScripts: (url: string): number => {
    unwrap(worker).importScripts(url);

    return scope.add(2, 3);
  },

  close: () => {
    unwrap(worker).close();
  },
}));

export type DefineWorker = typeof worker;
