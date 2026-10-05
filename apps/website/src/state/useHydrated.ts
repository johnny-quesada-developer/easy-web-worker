import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` while the server renders and while React hydrates, `true` afterwards.
 *
 * Persisted stores restore from localStorage when the module loads in the browser, which is before
 * hydration. Reading such a value during hydration would not match the server-rendered HTML, so
 * components show the default until this returns true, then switch to the stored value.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
