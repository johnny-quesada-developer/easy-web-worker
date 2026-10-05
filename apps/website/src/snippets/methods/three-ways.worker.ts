import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  // 1. a plain function: the returned value resolves the call
  double: (value: number) => value * 2,

  // 2. onMessage: the same, with the message and the event typed for you
  count: onMessage(async (to: number, message, event) => {
    message.reportProgress(50, { messageId: event.data.messageId });

    return to;
  }),

  // 3. onMessage().handle: only the message, and you complete it
  wait: onMessage<number, string>().handle((message) => {
    const timeoutId = setTimeout(() => message.resolve('done'), message.payload);

    message.onCancel(() => clearTimeout(timeoutId));
  }),
}));

export type ThreeWaysWorker = typeof worker;
