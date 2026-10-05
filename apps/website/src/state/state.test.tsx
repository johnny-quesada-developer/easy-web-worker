import { renderToString } from 'react-dom/server';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePackageManager, usePreferences } from './preferences';
import { useDialogs } from './dialogs';
import { useToast } from './toast';
import { useMotion } from './motion';
import { DEFAULT_CODE_THEME } from '../lib/code-themes.mjs';

const Probe = () => <span data-testid="pm">{usePackageManager()}</span>;

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  usePreferences.reset({ packageManager: 'npm', codeTheme: DEFAULT_CODE_THEME, theme: 'system' }, {});
  useDialogs.reset({ open: null }, {});
});

describe('preferences store', () => {
  it('persists changes under its localStorage key', () => {
    usePreferences.setState((current) => ({ ...current, packageManager: 'pnpm' }));

    const saved = JSON.parse(window.localStorage.getItem('user-preferences') ?? 'null');
    expect(saved.s).toEqual({ packageManager: 'pnpm', codeTheme: DEFAULT_CODE_THEME, theme: 'system' });
  });

  it('shares the value between separate React roots', () => {
    render(<Probe />);
    render(<Probe />);

    act(() => usePreferences.setState((current) => ({ ...current, packageManager: 'yarn' })));

    expect(screen.getAllByTestId('pm').map((node) => node.textContent)).toEqual(['yarn', 'yarn']);
  });

  it('server render always uses the default, even when a value is stored', () => {
    usePreferences.setState((current) => ({ ...current, packageManager: 'pnpm' }));

    expect(renderToString(<Probe />)).toContain('>npm<');
  });
});

describe('dialogs store', () => {
  it('opens one dialog at a time and only hides the named one', () => {
    useDialogs.actions.show('search');
    expect(useDialogs.getState().open).toBe('search');

    useDialogs.actions.show('navigation');
    expect(useDialogs.getState().open).toBe('navigation');

    useDialogs.actions.hide('search');
    expect(useDialogs.getState().open).toBe('navigation');

    useDialogs.actions.hide('navigation');
    expect(useDialogs.getState().open).toBeNull();
  });
});

describe('toast store', () => {
  it('shows a message and hides it after 2.6 seconds', () => {
    vi.useFakeTimers();
    useToast.actions.announce('Copied to clipboard');
    expect(useToast.getState()).toMatchObject({ message: 'Copied to clipboard', shown: true });

    vi.advanceTimersByTime(2600);
    expect(useToast.getState().shown).toBe(false);
    vi.useRealTimers();
  });
});

describe('motion store', () => {
  it('toggles the html class', () => {
    useMotion.actions.set(true);
    expect(document.documentElement.classList.contains('motion-off')).toBe(true);

    useMotion.actions.toggle();
    expect(document.documentElement.classList.contains('motion-off')).toBe(false);
  });
});
