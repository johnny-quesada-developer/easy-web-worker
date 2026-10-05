import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(() => ({
  parse: (json: string) => {
    if (!json) throw new Error('Empty input');

    return JSON.parse(json) as unknown;
  },
}));

export type ParserWorker = typeof worker;
