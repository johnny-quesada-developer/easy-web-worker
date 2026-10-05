import type { ComponentPropsWithoutRef } from 'react';
import { tv, type VariantProps } from '../lib/tv';

const badge = tv({
  base: 'inline-flex items-center gap-[6px] rounded-[5px] border border-line bg-soft px-[9px] py-[3px] text-10 leading-[1.7] font-[550] tracking-[0.045em] whitespace-nowrap text-muted',
  variants: {
    tone: {
      neutral: '',
      green: 'border-[#dce8df] bg-green-soft text-green dark:border-line',
      blue: 'border-[#e2e6ef] bg-blue-soft text-blue dark:border-line',
      amber: 'border-[#ebe2cc] bg-amber-soft text-amber dark:border-line',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

type BadgeProps = ComponentPropsWithoutRef<'span'> & VariantProps<typeof badge>;

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={badge({ tone, className })} {...props} />;
}
