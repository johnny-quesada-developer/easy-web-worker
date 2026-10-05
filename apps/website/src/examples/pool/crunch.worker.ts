import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(() => ({
  /** Keeps this worker busy for the given time, then says who did the work. */
  crunch: (milliseconds: number) => {
    const start = Date.now();

    while (Date.now() - start < milliseconds) {
      // a CPU-bound task: nothing else runs in this worker meanwhile
    }

    return self.name;
  },
}));

export type CrunchWorker = typeof worker;
