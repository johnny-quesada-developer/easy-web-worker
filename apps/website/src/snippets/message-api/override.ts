import { createEasyWebWorker, type EasyWebWorkerBody } from 'easy-web-worker';

type SearchResult = { id: string; title: string };

declare const searchBody: EasyWebWorkerBody<string, SearchResult[]>;

const search = createEasyWebWorker<string, SearchResult[]>(searchBody);

export function connect(input: HTMLInputElement, render: (results: SearchResult[]) => void) {
  input.oninput = async () => {
    // cancels what is pending, then sends the new message
    const results = await search.override(input.value, 'Superseded');

    render(results);
  };
}
