import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ transfer }) => ({
  // a returned value is copied
  histogram: (pixels: ArrayBuffer) => {
    const counts = new Array<number>(256).fill(0);

    new Uint8Array(pixels).forEach((value) => {
      counts[value] += 1;
    });

    return counts;
  },

  // transfer(result, transferList) moves the result instead of copying it
  invert: (pixels: ArrayBuffer) => {
    const bytes = new Uint8Array(pixels);

    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = 255 - bytes[index];
    }

    return transfer(bytes.buffer, [bytes.buffer]);
  },
}));

export type ImagesWorker = typeof worker;
