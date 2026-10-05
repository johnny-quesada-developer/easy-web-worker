import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  watch: onMessage<string, void>().handle((message) => {
    const source = new EventSource(message.payload);

    source.onmessage = (event) => message.reportProgress(0, event.data);
    source.onerror = () => message.reject(new Error('Connection lost'));

    // runs once, whether the call was resolved, rejected or canceled
    message.onFinalize(() => source.close());
  }),
}));

export type WatchWorker = typeof worker;
