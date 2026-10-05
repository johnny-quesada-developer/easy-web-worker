import { createWorker } from 'easy-web-worker/createWorker';
import workerUrl from './text.worker?worker&url';
import type { TextWorker } from './text.worker';

const text = createWorker<TextWorker>(workerUrl, {
  workerOptions: { type: 'module' },
});

export async function analyze(article: string, lines: string[]) {
  const words = await text.countWords(article); // number
  const duplicates = await text.findDuplicates(lines); // string[]
  const version = await text.version(); // string

  return { words, duplicates, version };
}
