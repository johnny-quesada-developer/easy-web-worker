import type * as EasyWebWorkerPackage from 'easy-web-worker';
import type { E2E } from './harness/main';

declare global {
  interface Window {
    easyWebWorker: typeof EasyWebWorkerPackage;
    e2e: E2E;
  }
}

export {};
