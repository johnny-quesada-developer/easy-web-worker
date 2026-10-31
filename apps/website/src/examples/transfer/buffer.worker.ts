import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ transfer }) => ({
  /** Receives the buffer, changes every byte and gives the same memory back. */
  invert: (pixels: ArrayBuffer) => {
    const bytes = new Uint8Array(pixels);

    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = 255 - bytes[index];
    }

    // transfer(result, transferList) moves the result instead of copying it
    return transfer(bytes.buffer, [bytes.buffer]);
  },
}));

export type BufferWorker = typeof worker;
