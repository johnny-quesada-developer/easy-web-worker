import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { tv, type VariantProps } from '../lib/tv';

const pageShell = tv({
  variants: { width: { wrap: 'wrap', wide: 'wide' } },
  defaultVariants: { width: 'wrap' },
});

type PageShellProps<T extends ElementType> = { as?: T } & VariantProps<typeof pageShell> &
  Omit<ComponentPropsWithoutRef<T>, 'as'>;

/** Centred content column: `wrap` (1160px marketing) or `wide` (1320px documentation). */
export function PageShell<T extends ElementType = 'div'>({ as, width, className, ...props }: PageShellProps<T>) {
  const Tag = (as ?? 'div') as ElementType;

  return <Tag className={pageShell({ width, className })} {...props} />;
}
