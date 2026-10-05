import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(() => ({
  countWords: (text: string) => text.trim().split(/\s+/).length,

  findDuplicates: (lines: string[]) =>
    lines.filter((line, index) => lines.indexOf(line) !== index),

  // no payload: called without arguments
  version: () => '1.0.0',
}));

export type TextWorker = typeof worker;
