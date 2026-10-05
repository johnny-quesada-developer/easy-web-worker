import type { ComponentPropsWithoutRef } from 'react';
import { tv, type VariantProps } from '../lib/tv';

const panel = tv({
  base: 'min-w-0 overflow-hidden rounded-panel border border-line bg-paper',
  variants: {
    tone: { paper: '', soft: 'bg-soft p-7 max-md:p-5' },
  },
  defaultVariants: { tone: 'paper' },
});

type PanelProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof panel>;

export function Panel({ tone, className, ...props }: PanelProps) {
  return <div className={panel({ tone, className })} {...props} />;
}

/** Reference `.panel-top`: the quiet header row of a panel. */
export function PanelTop({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`flex min-h-[45px] items-center justify-between gap-3 border-b border-line bg-surface px-[17px] py-3 text-11 text-muted [&_strong]:font-[550] [&_strong]:text-ink ${className ?? ''}`.trim()}
      {...props}
    />
  );
}

/** Reference `.mini-node`: a small framed label, optionally accented green (state) or blue (scope). */
const miniNode = tv({
  base: 'flex items-center justify-between rounded-[6px] border border-[#dde5df] bg-paper px-[15px] py-3 font-mono text-11 whitespace-normal dark:border-line',
  variants: {
    tone: { plain: '', accent: 'border-[#cfdfd3] bg-green-soft dark:border-line', blue: 'border-[#d6ddeb] bg-blue-soft dark:border-line' },
  },
  defaultVariants: { tone: 'plain' },
});

type MiniNodeProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof miniNode>;

export function MiniNode({ tone, className, ...props }: MiniNodeProps) {
  return <div className={miniNode({ tone, className })} {...props} />;
}
