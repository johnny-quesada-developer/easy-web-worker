import { useEffect } from 'react';
import { CODE_THEME_OPTIONS } from '../../lib/code-themes.mjs';
import { useCodeTheme, usePreferences, useResolvedCodeTheme } from '../../state/preferences';
import { Icon } from '../Icon';

/** Footer control that switches the syntax theme of every code block on the site. */
export function CodeThemeSelect() {
  const codeTheme = useCodeTheme();
  const resolved = useResolvedCodeTheme();

  useEffect(() => {
    document.documentElement.dataset.codeTheme = resolved;
  }, [resolved]);

  return (
    <label className="inline-flex min-h-6 items-center gap-2 text-12 text-muted">
      <Icon name="code" />
      <span className="sr-only">Code theme</span>
      <select
        className="cursor-pointer border-0 bg-transparent py-[2px] pr-1 font-[550] text-green hover:underline hover:underline-offset-[5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        value={codeTheme}
        onChange={(event) => usePreferences.setState((state) => ({ ...state, codeTheme: event.target.value }))}
      >
        {CODE_THEME_OPTIONS.map((theme) => (
          <option value={theme.id} key={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}
