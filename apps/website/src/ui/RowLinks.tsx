import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from './Icon';

/** Reference `.row-links`: a ruled row of equal columns; each item is a tall link with an arrow. */
export function RowLinks({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`mb-[65px] grid w-full grid-cols-3 border-y border-line max-md:mb-[35px] max-md:grid-cols-1 ${className ?? ''}`.trim()}
      {...props}
    />
  );
}

interface RowLinkProps {
  href?: string;
  kicker?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  external?: boolean;
}

const rowLink =
  'group relative flex min-h-[180px] min-w-0 flex-col items-start justify-start py-7 pr-[35px] [&+&]:border-l [&+&]:border-line [&+&]:pl-7 max-md:min-h-0 max-md:py-6! max-md:pr-7! max-md:pl-0! max-md:[&+&]:border-t max-md:[&+&]:border-l-0';

export function RowLink({ href, kicker, title, text, external }: RowLinkProps) {
  const body = (
    <>
      {kicker && <span className="mb-5 max-md:mb-3">{kicker}</span>}
      <h3 className="m-0 max-w-[230px] text-[calc(21px*var(--type-scale))] leading-[1.2] tracking-[-0.035em] group-hover:text-green max-md:max-w-none max-md:pr-[18px] max-md:text-22">
        {title}
      </h3>
      {text && <p className="mt-3 mb-0 max-w-[270px] text-13 leading-[1.75] max-md:max-w-none">{text}</p>}
      <Icon name={external ? 'external' : 'arrow'} className="absolute top-[29px] right-[17px] max-md:top-[26px] max-md:right-0" />
    </>
  );

  return href ? (
    <a className={rowLink} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      {body}
    </a>
  ) : (
    <div className={rowLink}>{body}</div>
  );
}
