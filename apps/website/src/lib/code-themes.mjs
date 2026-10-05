/**
 * The code themes a visitor can pick from. Every highlighted block carries one CSS variable per
 * theme (--sh-<id>), so switching is a data attribute on <html>, not a rebuild.
 * The surface colours below mirror each theme's own editor background and chrome.
 */
import lightPlus from 'shiki/themes/light-plus.mjs';
import darkPlus from 'shiki/themes/dark-plus.mjs';
import { rgshDark, rgshLight } from './shiki-theme.mjs';

export const CODE_THEMES = [
  { id: 'vscode-light', label: 'VS Code Light', theme: lightPlus },
  { id: 'rgsh-dark', label: 'Site palette dark', theme: rgshDark },
  { id: 'rgsh', label: 'Site palette light', theme: rgshLight },
  { id: 'vscode-dark', label: 'VS Code Dark', theme: darkPlus },
];

/** The stored value; 'auto' follows the site appearance. */
export const DEFAULT_CODE_THEME = 'auto';

export const CODE_THEME_OPTIONS = [{ id: 'auto', label: 'Match appearance' }, ...CODE_THEMES.map(({ id, label }) => ({ id, label }))];

export const CODE_THEME_IDS = CODE_THEME_OPTIONS.map((entry) => entry.id);

/** Turns the stored value into a real theme id. */
export function resolveCodeTheme(stored, dark) {
  if (stored && stored !== 'auto' && CODE_THEMES.some((entry) => entry.id === stored)) return stored;

  return dark ? 'rgsh-dark' : 'vscode-light';
}

/** { id: theme } for Shiki's multi-theme output. */
export const shikiThemes = Object.fromEntries(CODE_THEMES.map((entry) => [entry.id, entry.theme]));

export const CSS_VARIABLE_PREFIX = '--sh-';
