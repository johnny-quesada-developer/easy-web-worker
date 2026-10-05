import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  /** Receives the buffer, changes every byte and gives the same memory back. */
  invert: onMessage<ArrayBuffer, ArrayBuffer>().handle((message) => {
    const bytes = new Uint8Array(message.payload);

    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = 255 - bytes[index];
    }

    // the second argument transfers the result instead of copying it
    message.resolve(bytes.buffer, [bytes.buffer]);
  }),
}));

export type BufferWorker = typeof worker;
