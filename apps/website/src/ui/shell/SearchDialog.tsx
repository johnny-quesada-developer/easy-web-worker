import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { withBase } from '../../lib/site';
import { Icon } from '../Icon';
import { ButtonLink } from '../Button';
import { useDialog } from './useDialog';

interface Result {
  url: string;
  title: string;
  description: string;
  family: string;
}

interface PagefindResult {
  id: string;
  data: () => Promise<{ url: string; excerpt: string; meta: Record<string, string> }>;
}

interface Pagefind {
  init?: () => Promise<void>;
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
}

let loading: Promise<Pagefind> | undefined;

// Static search: Pagefind indexes the built HTML (see the `build` script). Its JS API is fetched the
// first time the dialog opens, so pages that never search pay nothing.
function loadPagefind(): Promise<Pagefind> {
  if (loading) return loading;

  loading = import(/* @vite-ignore */ withBase('pagefind/pagefind.js'))
    .then(async (pagefind: Pagefind) => {
      await pagefind.init?.();
      return pagefind;
    })
    .catch((error: Error) => {
      loading = undefined;
      throw error;
    });

  return loading;
}

const suggestions: Result[] = [
  { url: withBase('docs/getting-started/'), title: 'Getting started', description: 'Your first typed worker: define the methods, call them from the main thread, ship it with your bundler.', family: 'Documentation' },
  { url: withBase('docs/cancellation-and-progress/'), title: 'Cancellation and progress', description: 'Cancel a call from either thread, report progress, and stop work that never pauses.', family: 'Documentation' },
  { url: withBase('docs/api-reference/'), title: 'API reference', description: 'defineWorker, createWorker, unwrap, the message, the configuration and the message API.', family: 'Documentation' },
  { url: withBase('examples/'), title: 'Examples', description: 'Five interactive examples running real Web Workers.', family: 'Examples' },
];

const strip = (html: string) => html.replace(/<[^>]+>/g, '');

/** Global search dialog: Cmd/Ctrl+K or `/`, arrow-key result navigation, Enter opens, Escape closes. */
export function SearchDialog() {
  const dialog = useDialog('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'unavailable'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const version = useRef(0);

  useEffect(() => {
    if (!dialog.open) return;

    setQuery('');
    setResults(null);
    const timer = setTimeout(() => input.current?.focus(), 0);
    loadPagefind().catch(() => setStatus('unavailable'));

    return () => clearTimeout(timer);
  }, [dialog.open]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      return;
    }

    const run = ++version.current;
    setStatus('loading');

    loadPagefind()
      .then(async (pagefind) => {
        const { results: found } = await pagefind.search(term);
        const pages = await Promise.all(found.slice(0, 12).map((result) => result.data()));
        if (run !== version.current) return;

        setResults(
          pages.map((page) => ({
            url: page.url,
            title: page.meta.title ?? page.url,
            description: page.meta.description ?? strip(page.excerpt),
            family: page.meta.family ?? 'Documentation',
          })),
        );
        setStatus('idle');
      })
      .catch(() => {
        if (run === version.current) setStatus('unavailable');
      });
  }, [query]);

  const onShortcut = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const typing = target.matches('input, textarea, select, [contenteditable]');
    const shortcut = (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
    if (!shortcut) return;

    event.preventDefault();
    dialog.show();
  }, [dialog]);

  useEffect(() => {
    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, [onShortcut]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    // A search input swallows Escape to clear itself; close the dialog instead, as the reference does.
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;

    const items = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>('a[data-result]') ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);

    if (event.key === 'Enter') {
      if (document.activeElement === input.current) {
        event.preventDefault();
        items[0].click();
      }
      return;
    }

    event.preventDefault();
    const next = event.key === 'ArrowDown' ? (index + 1) % items.length : index <= 0 ? items.length - 1 : index - 1;
    items[next].focus();
  };

  const shown = results ?? suggestions;
  const searching = query.trim().length > 0;

  return (
    <dialog
      className="search-dialog mt-[16vh] w-[660px] max-md:mt-[10vh]"
      ref={dialog.ref}
      aria-label="Search documentation"
      onClose={dialog.onClose}
      onClick={(event) => {
        dialog.onBackdropClick(event);
        if ((event.target as HTMLElement).closest('a[data-result]')) dialog.close();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center gap-[15px] border-b border-line px-[23px] py-5 max-md:p-[17px]">
        <Icon name="search" className="text-muted" />
        <input
          ref={input}
          className="flex-1 border-0 bg-transparent p-0 text-15 shadow-none outline-none! max-md:text-13"
          type="search"
          placeholder="Search documentation…"
          aria-label="Search documentation"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-muted hover:bg-soft"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              input.current?.focus();
            }}
          >
            <Icon name="close" className="size-[14px]" />
          </button>
        )}
        <button type="button" className="rounded-[4px] border border-line px-[7px] py-[3px] text-10 text-muted" onClick={dialog.close}>
          Esc
        </button>
      </div>
      <div className="max-h-[380px] overflow-auto p-[10px] max-md:max-h-[55vh]" ref={list}>
        {status === 'unavailable' ? (
          <div className="px-5 py-[60px] text-center">
            <Icon name="search" className="mx-auto size-[27px] text-muted" />
            <h3 className="mt-3 mb-2 text-22">Search is not available.</h3>
            <p className="m-0 text-13">The search index was not found. Run yarn search:index (yarn dev and yarn build also create it).</p>
          </div>
        ) : searching && results && results.length === 0 ? (
          <div className="px-5 py-[60px] text-center">
            <Icon name="search" className="mx-auto size-[27px] text-muted" />
            <h3 className="mt-3 mb-2 text-22">No results for “{query.trim()}”.</h3>
            <p className="mb-5 text-13">Try a concept such as “selectors”, “actions” or “persistence”.</p>
            <ButtonLink size="small" icon="arrow" href={withBase('docs/')}>
              Browse all documentation
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="px-3 pt-[10px] pb-[5px] text-10 tracking-[0.08em] text-muted uppercase" role="status">
              {searching
                ? status === 'loading' && !results
                  ? 'Searching…'
                  : `${shown.length} result${shown.length === 1 ? '' : 's'}`
                : 'Suggested starting points'}
            </div>
            {shown.map((result) => (
              <a
                className="flex items-start gap-3 rounded-[7px] p-[13px] hover:bg-green-soft focus:bg-green-soft focus:outline-2 focus:-outline-offset-2 focus:outline-green max-md:gap-[9px] max-md:p-3"
                href={result.url}
                data-result
                key={result.url}
              >
                <Icon name={result.family === 'Examples' ? 'grid' : 'book'} className="mt-1 size-[14px] shrink-0 text-green" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-13 font-[550]">{result.title}</strong>
                  <small className="mt-[5px] block text-11 leading-[1.6] text-muted">{result.description}</small>
                </span>
                <Icon name="arrow" className="mt-1 shrink-0" />
              </a>
            ))}
          </>
        )}
      </div>
      <div className="flex justify-between border-t border-line px-[22px] py-3 text-10 text-muted max-md:px-[17px] max-md:text-9">
        <span>↑↓ Navigate ↵ Open Esc Close</span>
        <span>RGSH docs</span>
      </div>
    </dialog>
  );
}
