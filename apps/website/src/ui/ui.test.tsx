import { renderToString } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InstallCommand } from './InstallCommand';
import { usePreferences } from '../state/preferences';
import { DEFAULT_CODE_THEME } from '../lib/code-themes.mjs';

beforeEach(() => {
  window.localStorage.clear();
  usePreferences.setState({ packageManager: 'npm', codeTheme: DEFAULT_CODE_THEME, theme: 'system' });
});
afterEach(cleanup);

describe('InstallCommand', () => {
  it('shows the npm command by default and switches manager on click', () => {
    render(<InstallCommand />);
    expect(screen.getByText('npm install easy-web-worker')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'pnpm' }));

    expect(screen.getByText('pnpm add easy-web-worker')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'pnpm' }).getAttribute('aria-selected')).toBe('true');
  });

  it('keeps every install box on the page in sync through the shared store', () => {
    render(
      <>
        <InstallCommand />
        <InstallCommand pkg="other" />
      </>,
    );

    fireEvent.click(screen.getAllByRole('tab', { name: 'yarn' })[0]);

    expect(screen.getByText('yarn add easy-web-worker')).toBeTruthy();
    expect(screen.getByText('yarn add other')).toBeTruthy();
  });

  it('moves between managers with the arrow keys', () => {
    render(<InstallCommand />);

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByText('pnpm add easy-web-worker')).toBeTruthy();

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'End' });
    expect(screen.getByText('bun add easy-web-worker')).toBeTruthy();
  });

  it('renders the default on the server even if another manager is stored', () => {
    usePreferences.setState((current) => ({ ...current, packageManager: 'yarn' }));

    expect(renderToString(<InstallCommand />)).toContain('npm install easy-web-worker');
  });

  it('applies a stored choice after hydration', () => {
    usePreferences.setState((current) => ({ ...current, packageManager: 'yarn' }));

    render(<InstallCommand />);

    expect(screen.getByText('yarn add easy-web-worker')).toBeTruthy();
  });
});
