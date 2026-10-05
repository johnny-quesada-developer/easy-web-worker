import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  // a returned value is copied
  histogram: (pixels: ArrayBuffer) => {
    const counts = new Array<number>(256).fill(0);

    new Uint8Array(pixels).forEach((value) => {
      counts[value] += 1;
    });

    return counts;
  },

  // to transfer the result, complete the call yourself
  invert: onMessage<ArrayBuffer, ArrayBuffer>().handle((message) => {
    const bytes = new Uint8Array(message.payload);

    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = 255 - bytes[index];
    }

    message.resolve(bytes.buffer, [bytes.buffer]);
  }),
}));

export type ImagesWorker = typeof worker;
