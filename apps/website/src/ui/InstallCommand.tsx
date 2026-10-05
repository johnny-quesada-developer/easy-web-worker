import { PACKAGE_MANAGERS, usePackageManager, usePreferences, type PackageManager } from '../state/preferences';
import { Icon } from './Icon';

const install: Record<PackageManager, string> = {
  npm: 'npm install',
  pnpm: 'pnpm add',
  yarn: 'yarn add',
  bun: 'bun add',
};

interface InstallCommandProps {
  pkg?: string;
}

/** Terminal block plus package-manager tabs (reference `#install`). The choice is shared and remembered. */
export function InstallCommand({ pkg = 'easy-web-worker' }: InstallCommandProps) {
  const packageManager = usePackageManager();
  const command = `${install[packageManager]} ${pkg}`;

  const select = (choice: PackageManager) =>
    usePreferences.setState((preferences) => ({ ...preferences, packageManager: choice }));

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = PACKAGE_MANAGERS.indexOf(packageManager);
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % PACKAGE_MANAGERS.length,
      ArrowLeft: (index - 1 + PACKAGE_MANAGERS.length) % PACKAGE_MANAGERS.length,
      Home: 0,
      End: PACKAGE_MANAGERS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    select(PACKAGE_MANAGERS[next]);
    (event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next] ?? null)?.focus();
  };

  return (
    <div className="install">
      <figure className="code-block m-0">
        <div className="code-head">
          <span>
            <Icon name="terminal" />
            terminal
          </span>
          <button type="button" className="copy-button" data-copy={command} aria-label="Copy install command">
            <Icon name="copy" />
          </button>
        </div>
        <pre>
          <code>
            <span className="line" aria-live="polite">
              {command}
            </span>
          </code>
        </pre>
      </figure>
      <div className="-mt-3 mb-6 flex gap-3 border-b border-line px-4" role="tablist" aria-label="Package manager" onKeyDown={onKeyDown}>
        {PACKAGE_MANAGERS.map((manager) => (
          <button
            type="button"
            role="tab"
            key={manager}
            className="rounded-none border-b-2 border-transparent px-2 py-[14px] text-11 text-muted aria-selected:border-green aria-selected:font-[550] aria-selected:text-green"
            aria-selected={manager === packageManager}
            tabIndex={manager === packageManager ? 0 : -1}
            onClick={() => select(manager)}
          >
            {manager}
          </button>
        ))}
      </div>
    </div>
  );
}
