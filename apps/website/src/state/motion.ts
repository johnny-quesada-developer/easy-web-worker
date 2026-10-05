import { createGlobalState } from 'react-global-state-hooks';
import { useHydrated } from './useHydrated';

const query = '(prefers-reduced-motion: reduce)';

/**
 * Reduced motion: the system preference, overridable from the footer control for this visit.
 * Sequences read `reduced` and fall back to manual, complete frames when it is true.
 */
export const useMotion = createGlobalState(
  { reduced: false },
  {
    name: '_motion',
    actions: {
      set(reduced: boolean) {
        return ({ setState }) => setState({ reduced });
      },
      toggle() {
        return ({ setState, getState }) => setState({ reduced: !getState().reduced });
      },
    },
    callbacks: {
      onInit: ({ setState }) => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const media = window.matchMedia(query);
        setState({ reduced: media.matches });

        const onChange = (event: MediaQueryListEvent) => setState({ reduced: event.matches });
        media.addEventListener('change', onChange);

        return () => media.removeEventListener('change', onChange);
      },
      onStateChanged: ({ state }) => {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('motion-off', state.reduced);
      },
    },
  },
);

/** `false` until hydration (so the client matches the server HTML), then the live preference. */
export function useReducedMotion(): boolean {
  const hydrated = useHydrated();
  const [reduced] = useMotion((state) => state.reduced);

  return hydrated ? reduced : false;
}
