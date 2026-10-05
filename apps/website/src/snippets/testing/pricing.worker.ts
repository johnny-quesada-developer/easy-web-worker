import { defineWorker } from 'easy-web-worker/defineWorker';
import { average, total } from './pricing';

// the worker file only wires the functions; the logic is tested without it
const worker = defineWorker(() => ({ total, average }));

export type PricingWorker = typeof worker;
