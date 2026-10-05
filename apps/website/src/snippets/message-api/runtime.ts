import { createEasyWebWorker } from 'easy-web-worker';

export const worker = createEasyWebWorker<number, number>(({ onMessage }) => {
  onMessage((message) => {
    message.resolve(message.payload * 2);
  });
});

export const doubled = worker.send(21); // 42
