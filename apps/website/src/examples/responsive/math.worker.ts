import { defineWorker } from 'easy-web-worker/defineWorker';
import { fibonacci } from './math';

const worker = defineWorker(() => ({ fibonacci }));

export type MathWorker = typeof worker;
