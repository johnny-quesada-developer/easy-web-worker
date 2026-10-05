import { useEffect, useRef, useState } from 'react';
import { THEMES, usePreferences, useTheme, useDarkAppearance, type Theme } from '../../state/preferences';
import { Icon } from '../Icon';

const labels: Record<Theme, string> = { system: 'Match system', light: 'Light', dark: 'Dark' };

/**
 * Header control for the appearance. A click flips between light and dark, which is what almost
 * everyone wants and never lands on a choice that paints the same page. The menu behind the arrow
 * key or a long press holds all three, including the way back to the system setting.
 */
export function ThemeToggle() {
  const theme = useTheme();
  const dark = useDarkAppearance();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#131311' : '#ffffff');
  }, [dark]);

  useEffect(() => {
    if (!open) return;

    const dismiss = (event: MouseEvent | FocusEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);

    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
    };
  }, [open]);

  const pick = (next: Theme) => {
    usePreferences.setState((state) => ({ ...state, theme: next }));
    setOpen(false);
  };

  const label = dark ? 'Switch to the light appearance' : 'Switch to the dark appearance';

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-muted hover:bg-soft"
        title={`${label}. Arrow down for every option.`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => pick(dark ? 'light' : 'dark')}
        onContextMenu={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 z-40 min-w-[150px] rounded-[8px] border border-line bg-paper p-1 shadow-dialog"
          role="menu"
          aria-label="Appearance"
        >
          {THEMES.map((option) => (
            <button
              type="button"
              className="block w-full rounded-[5px] px-3 py-2 text-left text-12 text-muted hover:bg-soft aria-checked:font-[550] aria-checked:text-green"
              role="menuitemradio"
              aria-checked={theme === option}
              onClick={() => pick(option)}
              key={option}
            >
              {labels[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
