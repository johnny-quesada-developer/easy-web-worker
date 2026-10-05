import type { ComponentPropsWithoutRef } from 'react';

/** The reference icon set: single-path, stroked, 24px viewBox. */
export const ICONS = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  'up-right': 'M6 18 18 6M6 6h12v12',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  copy: 'M9 9h11v12H9zM15 9V3H3v12h6',
  check: 'm5 12 4 4L19 6',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18',
  book: 'M12 6c-4-3-7-3-10-2v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 2zm0 0v15',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  terminal: 'm4 6 5 5-5 5m9 1h7',
  external: 'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',
  play: 'm8 4 12 8-12 8z',
  pause: 'M8 4v16M16 4v16',
  reset: 'M3 10a9 9 0 1 1 2 9M3 3v7h7',
  replay: 'M4 9a8 8 0 1 1 0 6M4 3v6h6',
  sun: 'M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  moon: 'M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13',
  info: 'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  alert: 'm12 3 10 18H2zm0 6v5m0 3h.01',
  github:
    'M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.3-1.5-1-2 4-.4 7-2 7-7a5 5 0 0 0-1-3c0-1 0-3-1-4-2 0-3 1-4 2a14 14 0 0 0-6 0C8 3 6 2 4 3c-1 1-1 3-1 4a5 5 0 0 0-1 3c0 5 3 6 7 7-.7.5-1 1-1 2v4',
  layers: 'm12 2 10 6-10 6L2 8zm-10 11 10 6 10-6M2 18l10 6 10-6',
  folder: 'M2 5h7l3 3h10v13H2z',
  bolt: 'm13 2-9 12h7l-1 8L21 9h-8z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  shield: 'm12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6zm-4 10 3 3 6-6',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  mail: 'M2 5h20v14H2zm0 0 10 8 10-8',
  sliders: 'M4 3v18M12 3v18M20 3v18M1 8h6M9 16h6M17 10h6',
  store: 'm12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-2a8 8 0 0 1 16 0v2',
  branch: 'M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 7v10M18 7v2a5 5 0 0 1-5 5H6',
  box: 'm12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7 4.5l9 5',
  scope: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8z',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h9V3M7 21v-8h10v8',
  list: 'M4 3h16v18H4zM8 8h8M8 12h8M8 16h5',
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'name'> & { name: IconName };

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg className={`icon ${className ?? ''}`.trim()} viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d={ICONS[name]} />
    </svg>
  );
}

/** The site mark: two threads joined by one call. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 6v20m22-20v20M5 10h8l6 12h8" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="5" cy="10" r="3.5" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
      <circle cx="27" cy="22" r="3.5" fill="var(--color-paper)" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
