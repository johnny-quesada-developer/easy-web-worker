import { JSDOM } from "jsdom";

const { window } = new JSDOM("<!DOCTYPE html>");

export const WINDOW_MOCK = window;

export class BLOB_MOCK {
  public constructor(public content: string[], config: { type: string }) {}
}

export const URL_MOCK = {
  createObjectURL: (blob) => {
    const [content] = blob.content;

    const sourceString = `data:text/javascript;base64,${Buffer.from(
      `
    import { parentPort, isMainThread, workerData } from 'node:worker_threads';

    const self = {
      importScripts: () => {},
      close: parentPort.close,
      postMessage: (data) => {
        parentPort?.postMessage({
          data,
        });
      },
      onmessage: null,
      onerror: null,
    }
    
    parentPort.on('message', (message) => {
      self.onmessage?.(message);
    });

    parentPort.on('error', (error) => {
      self.onerror?.(error);
    });

    ;` + content.replace(/\n/g, " ")
    ).toString("base64")}`;

    return new URL(sourceString);
  },

  revokeObjectURL: () => {},
};
