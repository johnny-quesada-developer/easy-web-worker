import type { ReactNode } from 'react';

interface SymptomProps {
  id: string;
  title: string;
  open?: boolean;
  children: ReactNode;
}

/** Troubleshooting disclosure row (reference `.symptom`). `id` is the deep-link anchor. */
export function Symptom({ id, title, open, children }: SymptomProps) {
  return (
    <details className="symptom" id={id} open={open}>
      <summary>
        <h2 className="m-0 text-14 font-[550] tracking-normal">{title}</h2>
      </summary>
      <div>{children}</div>
    </details>
  );
}
