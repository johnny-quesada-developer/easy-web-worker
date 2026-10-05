import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './images.worker?worker&url';
import type { ImagesWorker } from './images.worker';

const images = createWorker<ImagesWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

export async function invert(file: File) {
  const buffer = await file.arrayBuffer();

  // the second argument is the transfer list
  const inverted = await images.invert(buffer, [buffer]);

  console.log(buffer.byteLength); // 0: the memory moved to the worker
  console.log(inverted.byteLength); // the full size, moved back

  return inverted;
}
