import { defineWorker, type WorkerMethodMessage } from 'easy-web-worker/defineWorker';

// a plain function can type its message by hand
const count = (to: number, message: WorkerMethodMessage<number>) => {
  message.reportProgress(100);

  return to;
};

const worker = defineWorker(() => ({ count }));

export type CounterWorker = typeof worker;
