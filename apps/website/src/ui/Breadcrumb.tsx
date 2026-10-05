import { Icon } from './Icon';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      className={`mb-[23px] flex flex-wrap items-center gap-[9px] text-11 text-muted ${className ?? ''}`.trim()}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <span className="contents" key={`${item.label}-${index}`}>
          {index > 0 && <Icon name="chevron" className="size-[14px]" />}
          {item.href ? (
            <a className="hover:text-green" href={item.href}>
              {item.label}
            </a>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
