import type { ReactNode } from 'react';
import { Icon } from './Icon';

const defaultTitles = { note: 'Keep in mind', tip: 'Tip', warning: 'Watch out', error: 'Error' } as const;

const tone = { note: '', tip: '', warning: 'warning', error: 'error' } as const;

interface CalloutProps {
  type?: keyof typeof defaultTitles;
  title?: string;
  className?: string;
  children: ReactNode;
}

/** Reference `.callout`: status icon, short title, supporting text. Usable from MDX. */
export function Callout({ type = 'note', title, className = '', children }: CalloutProps) {
  return (
    <aside className={`callout ${tone[type]} ${className}`.trim()}>
      <Icon name={type === 'warning' || type === 'error' ? 'alert' : 'info'} />
      <div>
        <strong>{title ?? defaultTitles[type]}</strong>
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
    </aside>
  );
}
