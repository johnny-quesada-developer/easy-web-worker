import { withBase } from '../../lib/site';
import { drawerNav } from '../../lib/nav';
import { Icon, Logo } from '../Icon';
import { ButtonLink } from '../Button';
import { useDialog } from './useDialog';

interface NavDrawerProps {
  pathname: string;
}

/** Mobile navigation sheet (reference `#nav-dialog`). */
export function NavDrawer({ pathname }: NavDrawerProps) {
  const dialog = useDialog('navigation');

  return (
    <dialog className="drawer" ref={dialog.ref} aria-label="Navigation" onClose={dialog.onClose} onClick={dialog.onBackdropClick}>
      <div className="mb-5 flex items-center justify-between border-b border-line pb-5">
        <a className="flex items-center gap-[10px] text-14 font-[650] tracking-[-0.035em]" href={withBase()}>
          <Logo className="size-[29px]" />
          <span>RGSH</span>
        </a>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper hover:bg-soft"
          aria-label="Close navigation"
          onClick={dialog.close}
        >
          <Icon name="close" />
        </button>
      </div>
      <nav aria-label="Mobile navigation">
        {drawerNav.map((item) => {
          const current = item.href === withBase() ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <a
              className="flex items-center justify-between border-b border-line py-[18px] text-19 font-[550] aria-[current=page]:text-green"
              href={item.href}
              aria-current={current ? 'page' : undefined}
              key={item.label}
              onClick={dialog.close}
            >
              {item.label}
              <Icon name="arrow" />
            </a>
          );
        })}
      </nav>
      <div className="py-6">
        <ButtonLink variant="primary" icon="arrow" className="w-full text-14" href={withBase('docs/getting-started/')} onClick={dialog.close}>
          Get started
        </ButtonLink>
        <button
          type="button"
          className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-[10px] rounded-control border border-[#dbe1dc] bg-paper px-4 text-14 font-[550] hover:bg-soft dark:border-line"
          data-dialog="search"
        >
          <Icon name="search" />
          Search the site
        </button>
      </div>
      <p className="mt-1 text-11 text-muted">
        Real Web Workers. Typed methods.
        <br />
        Cancelable promises.
      </p>
    </dialog>
  );
}
