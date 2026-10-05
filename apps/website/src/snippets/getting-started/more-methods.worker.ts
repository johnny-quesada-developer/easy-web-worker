import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(() => ({
  countWords: (text: string) => text.trim().split(/\s+/).length,

  // async methods work the same way
  loadReport: async (url: string) => {
    const response = await fetch(url);

    // what a method throws rejects the call on the main thread
    if (!response.ok) throw new Error(`Report not available: ${response.status}`);

    return response.text();
  },
}));

export type TextWorker = typeof worker;
