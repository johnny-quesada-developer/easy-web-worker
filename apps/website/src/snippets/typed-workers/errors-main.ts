import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './errors.worker?worker&url';
import type { ParserWorker } from './errors.worker';

const parser = createWorker<ParserWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

export async function safeParse(json: string) {
  try {
    return await parser.parse(json);
  } catch (error) {
    // the Error thrown inside the worker, rebuilt on this side
    console.log((error as Error).message); // 'Empty input'

    return null;
  }
}
