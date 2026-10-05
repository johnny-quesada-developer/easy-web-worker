import type { ReactNode } from 'react';
import { withBase } from '../../lib/site';
import { footerNav } from '../../lib/nav';
import { Logo } from '../Icon';

interface FooterProps {
  /** The reduced-motion island, rendered in the bottom row. */
  children?: ReactNode;
}

export function Footer({ children }: FooterProps) {
  return (
    <footer className="site-footer mt-[100px] border-t border-line pt-[54px] pb-[26px] max-md:mt-[60px] max-md:pt-[38px] max-md:pb-5">
      <div className="wrap">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[30px] max-md:grid-cols-2 max-md:gap-7">
          <div className="max-md:col-span-full">
            <a className="flex items-center gap-[10px] text-14 font-[650] tracking-[-0.035em] whitespace-nowrap" href={withBase()}>
              <Logo className="size-[29px]" />
              <span>easy-web-worker</span>
            </a>
            <p className="mt-[14px] max-w-[280px] text-12 leading-[1.8]">
              Real Web Workers.
              <br />
              Functions instead of messages.
              <br />A main thread that stays free.
            </p>
          </div>
          {footerNav.map((column) => (
            <div key={column.title}>
              <h3 className="mb-[15px] text-13 tracking-normal">{column.title}</h3>
              {column.links.map((link) => (
                <a
                  className="my-[9px] block text-12 text-muted hover:text-green"
                  href={link.href}
                  target={'external' in link && link.external ? '_blank' : undefined}
                  rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                  key={link.label}
                >
                  {link.label}
                  {'external' in link && link.external ? ' ↗' : ''}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-between gap-5 border-t border-line pt-5 text-10 text-muted max-md:mt-[26px] max-md:flex-col max-md:items-start max-md:gap-3">
          <span>Built by Johnny Quesada.</span>
          {children}
        </div>
      </div>
    </footer>
  );
}
