import type { ReactNode } from 'react';
import { links, withBase } from '../../lib/site';
import { isActive, primaryNav } from '../../lib/nav';
import { Icon, Logo } from '../Icon';
import { ButtonLink } from '../Button';

interface HeaderProps {
  pathname: string;
  /** The appearance toggle island, rendered between search and the repository link. */
  children?: ReactNode;
}

const iconButton =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper hover:bg-soft';

/** Sticky header, 78px on desktop and 65px on mobile. Dialog triggers are static; islands listen. */
export function Header({ pathname, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-header border-b border-line bg-paper/[.97] max-md:h-header-mobile">
      <div className="wide flex h-full items-center gap-6 max-3xl:gap-[14px] max-xl:gap-3 max-md:gap-2 max-xs:gap-1">
        <a
          className="flex items-center gap-[10px] text-14 font-[650] tracking-[-0.035em] whitespace-nowrap max-3xl:text-12 max-md:gap-2 max-md:tracking-[-0.03em] max-xs:gap-[6px] max-xs:text-[calc(10.5px*var(--type-scale))]"
          href={withBase()}
          aria-label="easy-web-worker home"
        >
          <Logo className="size-[29px] max-3xl:size-[26px] max-md:size-6 max-xs:size-[22px]" />
          <span>easy-web-worker</span>
        </a>

        <nav className="ml-auto flex items-center gap-[25px] text-12 max-3xl:gap-[17px] max-xl:gap-[15px] max-xl:text-11 max-md:hidden" aria-label="Main navigation">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.match);

            return (
              <a
                className="flex h-header items-center border-b-2 border-transparent pt-[2px] hover:text-green aria-[current=page]:border-green aria-[current=page]:text-green"
                href={item.href}
                aria-current={active ? 'page' : undefined}
                key={item.label}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 max-md:ml-auto max-md:gap-1">
          <button
            type="button"
            className={`${iconButton} w-[70px] gap-2 text-muted max-xl:w-[38px] max-md:h-[34px] max-md:w-[38px] max-md:min-w-[34px] max-xs:w-[30px]`}
            data-dialog="search"
            aria-label="Search documentation"
          >
            <Icon name="search" />
            <kbd className="max-xl:hidden" aria-hidden="true">
              ⌘ K
            </kbd>
          </button>
          {children}
          <a
            className={`${iconButton} max-xl:hidden`}
            href={links.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View repository on GitHub"
          >
            <Icon name="github" />
          </a>
          <ButtonLink variant="primary" size="small" icon="arrow" className="max-3xl:hidden" href={withBase('docs/getting-started/')}>
            Get started
          </ButtonLink>
          <button
            type="button"
            className="hidden h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper hover:bg-soft max-md:inline-flex max-xs:w-8"

            data-dialog="navigation"
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
