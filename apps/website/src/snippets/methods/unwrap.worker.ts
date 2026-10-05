import { defineWorker, unwrap } from 'easy-web-worker/defineWorker';

const worker = defineWorker(() => ({
  ping: () => 'pong',
}));

// the worker-side controls behind the methods
unwrap(worker).importScripts('https://example.com/library.js');

// handles the messages sent without a method: send, override, overrideAfterCurrent
unwrap(worker).onMessage((message) => {
  message.resolve();
});

export type PingWorker = typeof worker;
