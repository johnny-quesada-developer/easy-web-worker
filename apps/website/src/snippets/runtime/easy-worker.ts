import { createWorker } from 'easy-web-worker/createWorker';

// the methods registered through easyWorker are described in the generic
export const worker = createWorker<{
  double: (value: number) => number;
  triple: (value: number) => number;
}>(({ easyWorker }) => {
  // a named handler, message style
  easyWorker.onMessage<number, number>('double', (message) => {
    message.resolve(message.payload * 2);
  });

  // the handler for messages sent without a method
  easyWorker.onMessage((message) => {
    message.resolve();
  });

  return {
    triple: (value: number) => value * 3,
  };
});
