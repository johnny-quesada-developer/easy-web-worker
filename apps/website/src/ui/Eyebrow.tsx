import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** Section label with a leading rule. */
export function Eyebrow({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={`eyebrow ${className ?? ''}`.trim()} {...props} />;
}

interface SectionHeadProps {
  kicker: string;
  title?: ReactNode;
  lead?: ReactNode;
  className?: string;
  id?: string;
}

/** Reference `.section-head`: eyebrow, 38px title, optional lead, 35px bottom margin. */
export function SectionHead({ kicker, title, lead, className, id }: SectionHeadProps) {
  return (
    <div className={`mb-[35px] block max-w-[760px] ${className ?? ''}`.trim()}>
      <Eyebrow className="mb-4">{kicker}</Eyebrow>
      <h2 className="mb-[14px] text-38 leading-[1.15] max-md:text-[calc(31px*var(--type-scale))]" id={id}>
        {title}
      </h2>
      {lead && <p className="m-0 max-w-[660px] text-16 leading-[1.75] max-md:text-14">{lead}</p>}
    </div>
  );
}
