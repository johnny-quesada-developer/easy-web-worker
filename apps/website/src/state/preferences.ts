import { createGlobalState } from 'react-global-state-hooks';
import { z } from 'zod';
import { useHydrated } from './useHydrated';
import { CODE_THEME_IDS, DEFAULT_CODE_THEME, resolveCodeTheme } from '../lib/code-themes.mjs';
import { useSyncExternalStore } from 'react';

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** 'system' follows prefers-color-scheme; the other two override it for this browser. */
export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const schema = z.object({
  packageManager: z.enum(PACKAGE_MANAGERS),
  codeTheme: z.enum(CODE_THEME_IDS as [string, ...string[]]),
  theme: z.enum(THEMES),
});

export type Preferences = z.infer<typeof schema>;

const defaults: Preferences = {
  packageManager: 'npm',
  codeTheme: DEFAULT_CODE_THEME,
  theme: 'system',
};

/** Bumped when a stored shape must not be trusted any more; see the migrator. */
export const PREFERENCES_VERSION = 2;

/** What survives an upgrade: the picked appearance and package manager, each optional. */
const carried = schema.pick({ packageManager: true, theme: true }).partial().catch({});

/**
 * Visitor preferences shared by every island on every page (the install command tab).
 * Saved to localStorage; anything unexpected in storage falls back to the defaults.
 */
export const usePreferences = createGlobalState(defaults, {
  name: '_sitePreferences',
  localStorage: {
    key: 'user-preferences',
    versioning: {
      version: PREFERENCES_VERSION,
      // Version 1 persisted the code theme as a concrete id even when nobody had picked one, so a
      // page that later turned dark kept painting light code. Only `carried` survives the upgrade.
      migrator: ({ legacy, initial }) => ({ ...initial, ...carried.parse(legacy) }),
    },
    // a parse error is caught by the store, which then keeps the defaults
    validator: ({ restored, initial }) => schema.parse({ ...initial, ...(restored as Partial<Preferences>) }),
  },
});

/** The stored package manager after hydration, the default before it (see useHydrated). */
export function usePackageManager(): PackageManager {
  const hydrated = useHydrated();
  const [packageManager] = usePreferences((preferences) => preferences.packageManager);

  return hydrated ? packageManager : defaults.packageManager;
}

/** The stored code theme after hydration, the default before it (see useHydrated). */
export function useCodeTheme(): string {
  const hydrated = useHydrated();
  const [codeTheme] = usePreferences((preferences) => preferences.codeTheme);

  return hydrated ? codeTheme : defaults.codeTheme;
}

/** The stored theme after hydration, 'system' before it (see useHydrated). */
export function useTheme(): Theme {
  const hydrated = useHydrated();
  const [theme] = usePreferences((preferences) => preferences.theme);

  return hydrated ? theme : defaults.theme;
}

/** True when the page is currently painted dark, whether that came from the choice or the system. */
export function useDarkAppearance(): boolean {
  const theme = useTheme();
  const systemDark = useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      query.addEventListener('change', notify);

      return () => query.removeEventListener('change', notify);
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  );

  return theme === 'system' ? systemDark : theme === 'dark';
}

/** The code theme actually in use: the stored one, or the one that matches the appearance. */
export function useResolvedCodeTheme(): string {
  const stored = useCodeTheme();
  const dark = useDarkAppearance();

  return resolveCodeTheme(stored, dark);
}
