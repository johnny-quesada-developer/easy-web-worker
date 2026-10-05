import { createEasyWebWorker } from 'easy-web-worker';
import workerUrl from './static.worker?worker&url';

export const worker = createEasyWebWorker<number, number>(workerUrl, {
  workerOptions: { type: 'module' },
});

export async function run() {
  const doubled = await worker.send(21); // the default handler

  // the result type comes first, then the payload type
  const upper = await worker.sendToMethod<string, string>('uppercase', 'hello');

  return { doubled, upper };
}
