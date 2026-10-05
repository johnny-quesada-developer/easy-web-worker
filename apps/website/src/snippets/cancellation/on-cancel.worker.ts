import { defineWorker } from 'easy-web-worker/defineWorker';

const worker = defineWorker(({ onMessage }) => ({
  search: onMessage(async (query: string, message) => {
    const controller = new AbortController();

    // called when the main thread cancels the call
    message.onCancel(() => controller.abort());

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });

    return (await response.json()) as string[];
  }),
}));

export type SearchWorker = typeof worker;
