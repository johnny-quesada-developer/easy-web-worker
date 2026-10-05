import { PACKAGE_VERSION, withBase } from '../../lib/site';
import { Badge } from '../Badge';

export interface NavPage {
  id: string;
  title: string;
  /** Shorter sidebar label. */
  short?: string;
}

export interface NavGroup {
  title: string;
  pages: NavPage[];
}

interface DocsSidebarProps {
  sections: NavGroup[];
  currentId?: string;
  /** Larger touch targets inside the mobile drawer. */
  drawer?: boolean;
}

/** Grouped article navigation with the documented version (reference `.docs-side`). */
export function DocsSidebar({ sections, currentId, drawer = false }: DocsSidebarProps) {
  return (
    <>
      <div className="mb-[22px] flex items-center justify-between gap-2 rounded-[4px] border border-line bg-soft px-[9px] py-2">
        <Badge className="border-0 bg-transparent p-0 text-10">Documentation</Badge>
        <span className="font-mono text-10 text-muted">{PACKAGE_VERSION}</span>
      </div>
      {sections.map((section) => (
        <div className="my-5" key={section.title}>
          <h3 className="mx-0 mt-0 mb-[7px] ml-[10px] text-10 font-[650] tracking-[0.08em] text-muted uppercase">{section.title}</h3>
          {section.pages.map((page) => (
            <a
              className={`block border-l-2 border-transparent leading-[1.5] text-[#69716b] hover:bg-soft hover:text-ink aria-[current=page]:border-green aria-[current=page]:bg-green-soft aria-[current=page]:font-[550] aria-[current=page]:text-green dark:text-muted ${drawer ? 'px-[10px] py-[9px] text-13' : 'px-[10px] py-[6px] text-11'}`}
              href={withBase(`docs/${page.id}/`)}
              aria-current={page.id === currentId ? 'page' : undefined}
              key={page.id}
            >
              {page.short ?? page.title}
            </a>
          ))}
        </div>
      ))}
    </>
  );
}
