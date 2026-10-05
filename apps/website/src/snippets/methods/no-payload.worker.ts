import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  // the payload is declared as null to reach the message
  status: onMessage((_payload: null, message) => {
    message.reportProgress(50);

    return 'ready';
  }),
}));

export type StatusWorker = typeof worker;
