import type { ReactNode } from 'react';

interface StripCtaProps {
  title?: ReactNode;
  text: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Reference `.strip-cta`: framed closing prompt with one action. */
export function StripCta({ title, text, action, className }: StripCtaProps) {
  return (
    <div
      className={`mt-[42px] flex items-center justify-between gap-[30px] rounded-[8px] border border-line bg-surface px-[30px] py-[26px] max-md:block max-md:p-[23px] ${className ?? ''}`.trim()}
    >
      <div className="min-w-0">
        <h3 className="mb-2 text-19">{title}</h3>
        <p className="m-0 max-w-[650px] text-12">{text}</p>
      </div>
      <div className="shrink-0 max-md:mt-5">{action}</div>
    </div>
  );
}
