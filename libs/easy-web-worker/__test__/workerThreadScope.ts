import { parentPort } from 'node:worker_threads';

/**
 * The tests run the workers in node worker threads, this gives them the scope a web worker has.
 * Import it first in the worker files.
 */
const scope = {
  importScripts: () => {},
  close: () => parentPort.close(),
  postMessage: (data: unknown, transfer?: Transferable[]) => {
    parentPort.postMessage({ data }, transfer as never);
  },
  onmessage: null as (event: unknown) => void,
  onerror: null as (event: unknown) => void,
};

Object.assign(globalThis, { self: scope });

parentPort.on('message', (message) => {
  scope.onmessage?.(message);
});
