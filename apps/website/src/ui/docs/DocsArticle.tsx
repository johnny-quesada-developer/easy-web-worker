import type { ReactNode } from 'react';
import { links, withBase } from '../../lib/site';
import { Badge } from '../Badge';
import { Breadcrumb } from '../Breadcrumb';
import { Icon } from '../Icon';
import { TextLink } from '../Button';
import { DocsSidebar, type NavGroup, type NavPage } from './DocsSidebar';

export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
}

interface DocsArticleProps {
  id: string;
  title: string;
  description: string;
  section: string;
  kind: 'Guide' | 'API reference' | 'Problem solving';
  status: 'stable' | 'beta';
  sections: NavGroup[];
  headings: TocHeading[];
  previous?: NavPage;
  next?: NavPage;
  /** The rendered MDX body. */
  children: ReactNode;
}

const nextLink =
  'flex flex-col gap-[10px] rounded-control border border-line p-[18px] text-13 font-[550] hover:border-[#acc2b3] dark:hover:border-line hover:bg-surface max-md:p-[13px] max-md:text-12';

/** The documentation reading shell: grouped sidebar, article column, on-page navigation. */
export function DocsArticle({ id, title, description, section, kind, status, sections, headings, previous, next, children }: DocsArticleProps) {
  const toc = headings.filter((heading) => heading.depth === 2 || heading.depth === 3);
  const source = `${links.repo}/blob/main/apps/website/src/content/docs/${id}.mdx`;

  return (
    <>
      <div className="sticky top-header-mobile z-20 hidden items-center justify-between gap-[10px] border-b border-line bg-[#f9fbf7] px-[18px] py-[9px] text-11 max-md:flex dark:bg-surface" data-pagefind-ignore>
        <button type="button" className="flex items-center gap-2 text-13 font-[550] text-green" data-dialog="docs">
          <Icon name="menu" />
          Browse docs
        </button>
        <label className="sr-only" htmlFor="mobile-toc">
          On this page
        </label>
        <select id="mobile-toc" className="max-w-[170px] rounded-control border-line bg-transparent px-[7px] py-1 text-11" data-toc-select defaultValue="">
          <option value="">On this page</option>
          {toc.map((heading) => (
            <option value={heading.slug} key={heading.slug}>
              {heading.text}
            </option>
          ))}
        </select>
      </div>

      <div className="wide grid grid-cols-[220px_minmax(0,1fr)_178px] items-start gap-[44px] max-3xl:grid-cols-[195px_minmax(0,1fr)] max-3xl:gap-[35px] max-md:block 4xl:grid-cols-[230px_minmax(0,1fr)_185px] 4xl:gap-[50px]">
        <aside
          className="sticky top-[105px] max-h-[calc(100vh-132px)] [scrollbar-width:thin] overflow-auto pt-[27px] pr-[14px] pb-[25px] text-12 max-md:hidden"
          aria-label="Documentation navigation"
          data-pagefind-ignore
        >
          <DocsSidebar sections={sections} currentId={id} />
        </aside>

        <article className="min-w-0 pt-[52px] max-md:pt-[30px]">
          <Breadcrumb items={[{ label: 'Docs', href: withBase('docs/') }, { label: section }]} className="max-md:text-10" />
          <h1 className="max-w-[690px] text-[calc(43px*var(--type-scale))] leading-[1.12] tracking-[-0.05em] [overflow-wrap:anywhere] max-md:text-[calc(35px*var(--type-scale))] max-md:leading-[1.16] max-xs:text-32">
            {title}
          </h1>
          <p className="max-w-[650px] text-16 leading-[1.75] max-md:text-15">{description}</p>
          <div className="mb-[30px] flex flex-wrap items-center gap-[15px] border-b border-line py-[18px] text-10 text-muted" data-pagefind-ignore>
            <Badge>{kind}</Badge>
            {status === 'beta' && <Badge tone="amber">Beta</Badge>}
            <span>TypeScript</span>
            <TextLink className="ml-auto max-md:ml-0" href={withBase('examples/')}>
              Try an example
            </TextLink>
          </div>

          <div className="doc-content">{children}</div>

          <nav className="mt-[45px] grid grid-cols-2 gap-4 border-t border-line pt-[25px] max-md:gap-[10px]" aria-label="Previous and next pages" data-pagefind-ignore>
            {previous ? (
              <a className={nextLink} href={withBase(`docs/${previous.id}/`)} rel="prev">
                <span className="text-11 font-normal text-muted">Previous</span>
                <strong className="flex items-center justify-between gap-[9px] text-13 leading-[1.5] max-md:text-12">{previous.short ?? previous.title}</strong>
              </a>
            ) : (
              <a className={nextLink} href={withBase('docs/')}>
                <span className="text-11 font-normal text-muted">Back to</span>
                <strong className="flex items-center justify-between gap-[9px] text-13 leading-[1.5] max-md:text-12">Documentation</strong>
              </a>
            )}
            {next ? (
              <a className={nextLink} href={withBase(`docs/${next.id}/`)} rel="next">
                <span className="text-11 font-normal text-muted">Next</span>
                <strong className="flex items-center justify-between gap-[9px] text-13 leading-[1.5] max-md:text-12">
                  {next.short ?? next.title}
                  <Icon name="arrow" />
                </strong>
              </a>
            ) : (
              <a className={nextLink} href={withBase('examples/')}>
                <span className="text-11 font-normal text-muted">Next</span>
                <strong className="flex items-center justify-between gap-[9px] text-13 leading-[1.5] max-md:text-12">
                  Try an example
                  <Icon name="arrow" />
                </strong>
              </a>
            )}
          </nav>
        </article>

        <aside className="sticky top-[123px] mt-[47px] border-l border-line pt-[5px] pl-[15px] text-10 max-3xl:hidden" aria-label="On this page" data-pagefind-ignore>
          <h3 className="mb-[17px] text-10 leading-[1.4] font-semibold tracking-[0.08em] text-muted uppercase">On this page</h3>
          {toc.map((heading) => (
            <a
              className={`block py-[5px] leading-[1.5] text-muted hover:text-green aria-[current=true]:text-green ${heading.depth === 3 ? 'pl-[10px]' : ''}`}
              href={`#${heading.slug}`}
              data-toc-link={heading.slug}
              key={heading.slug}
            >
              {heading.text}
            </a>
          ))}
          <div className="mt-[22px] border-t border-line pt-[14px]">
            <button type="button" className="inline-flex items-center gap-2 text-13 font-[550] text-green hover:underline hover:underline-offset-[5px]" data-dialog="search">
              <Icon name="search" />
              Search docs
            </button>
            <a className="mt-2 inline-flex items-center gap-[5px] text-13 font-[550] text-ink hover:text-green" href={source} target="_blank" rel="noopener noreferrer">
              Source article
              <Icon name="external" />
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
