import { defineWorker } from 'easy-web-worker/defineWorker';
import { longestChain } from './collatz';

const worker = defineWorker(({ onMessage }) => ({
  /** Searches one segment, reports how far it is, and says which worker did it. */
  longestChain: onMessage(([from, to]: [from: number, to: number], message) => ({
    ...longestChain(from, to, (percentage) => message.reportProgress(percentage, { worker: self.name })),
    worker: self.name,
  })),
}));

export type CollatzWorker = typeof worker;
