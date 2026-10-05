import { links, withBase } from './site';

/** Primary destinations, shared by the header, the mobile drawer and the footer. */
export const primaryNav = [
  { label: 'Docs', href: withBase('docs/'), match: withBase('docs/') },
  { label: 'Examples', href: withBase('examples/'), match: withBase('examples/') },
  { label: 'API', href: withBase('docs/api-reference/'), match: withBase('docs/api-reference/') },
  { label: 'About', href: withBase('about/'), match: withBase('about/') },
] as const;

export const drawerNav = [
  { label: 'Home', href: withBase() },
  { label: 'Documentation', href: withBase('docs/') },
  { label: 'Examples', href: withBase('examples/') },
  { label: 'API reference', href: withBase('docs/api-reference/') },
  { label: 'About Johnny', href: withBase('about/') },
] as const;

export const footerNav = [
  {
    title: 'Build',
    links: [
      { label: 'Getting started', href: withBase('docs/getting-started/') },
      { label: 'Documentation', href: withBase('docs/') },
      { label: 'Examples', href: withBase('examples/') },
      { label: 'Platform & versions', href: withBase('docs/platform-and-versions/') },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'API reference', href: withBase('docs/api-reference/') },
      { label: 'About the author', href: withBase('about/') },
      { label: 'react-global-state-hooks', href: links.globalStateHooks, external: true },
      { label: 'Report an issue', href: `${links.repo}/issues`, external: true },
    ],
  },
  {
    title: 'Open source',
    links: [
      { label: 'GitHub', href: links.repo, external: true },
      { label: 'npm', href: links.npm, external: true },
      { label: 'ISC license', href: `${links.repo}/blob/main/LICENSE`, external: true },
    ],
  },
] as const;

export const isActive = (pathname: string, match: string) => pathname.startsWith(match);
