/** Author profile content. This is the source for case studies, roles, dates and quantitative claims. */

export interface CaseStudy {
  id: string;
  company: string;
  years: string;
  headline: string;
  context: string;
  problem: string;
  responsibility: string;
  decisions: string[];
  outcome: string;
  metric: string;
  metricLabel: string;
  detail: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'idiomatic-performance',
    company: 'Idiomatic',
    years: '2022 — 2024',
    headline: 'Make performance an architectural decision.',
    context: 'An AI Voice-of-Customer analytics product with interactive charts and customer-specific views.',
    problem:
      'The application was highly dynamic and visualization-heavy, and typical screens took 40 to 60 seconds to load because expensive data aggregation happened in the browser.',
    responsibility: 'Rethinking the performance architecture end to end, while the product stayed flexible and interactive for customers.',
    decisions: [
      'Moved aggregation from the browser into Elasticsearch aggregations.',
      'Redesigned the APIs so each component could fetch focused data on its own.',
      'Added request caching and de-duplication.',
      'Kept Web Workers for the computation that still belonged on the client.',
      'Built the organization’s design system and removed legacy dependencies.',
    ],
    outcome:
      'Reduced typical loading times from 40–60 seconds to approximately 0.5–1 second. Dependency cleanup cut the bundle by about 35%, and the design system helped deliver a major rebrand in approximately 20% of the estimated time.',
    metric: '40–60s → ~0.5–1s',
    metricLabel: 'Typical load time · author-reported',
    detail: 'Dependency cleanup and a shared design system also supported a smaller bundle and a faster rebrand.',
  },
  {
    id: 'rematter-mobile-architecture',
    company: 'ReMatter',
    years: '2021 — 2022',
    headline: 'Two products. One well-built foundation.',
    context: 'A startup modernizing the scrap-metal recycling industry, with web and mobile products.',
    problem:
      'Two mobile applications had different product goals but overlapping business logic, UI and infrastructure. Maintaining two implementations would have duplicated work and drifted apart.',
    responsibility: 'Designing the shared foundation and leading the start of the driver application built on it.',
    decisions: [
      'Organized both apps in an Nx monorepo with a shared core of components, hooks and application logic.',
      'Made React composition the architectural basis: small, semantic primitives that combine into different workflows.',
      'Introduced stable TypeScript contracts so teams could work in parallel.',
      'Established unit testing as a standard requirement.',
    ],
    outcome:
      'Gave both mobile apps a shared foundation for business logic, UI and infrastructure. Engineers could build features from tested, reusable components and apply improvements across both products.',
    metric: '2 apps / 1 core',
    metricLabel: 'Shared mobile architecture',
    detail: 'The case study focuses on the shared foundation and the start of the driver application.',
  },
  {
    id: 'jumpcloud-incremental-modernization',
    company: 'JumpCloud',
    years: '2019 — 2020',
    headline: 'Modernize without stopping the roadmap.',
    context: 'Through the consultancy Gorilla Logic. A cloud directory and identity platform.',
    problem:
      'Large parts of the product were built on Backbone and needed to move to Vue, but a rewrite would have competed with customer-facing work.',
    responsibility: 'Defining the migration strategy, and improving how the team built its preconfigured SAML integrations.',
    decisions: [
      'Designed an incremental path so architectural migration and new features shipped together.',
      'Redesigned parts of the architecture and delivery process behind SAML connector creation to remove friction for the whole team.',
      'Reorganized responsibilities and trained an engineer who had mostly built repetitive connectors, widening what the team could take on.',
    ],
    outcome:
      'Saved approximately 7–8 months of engineering effort through incremental migration. Improvements to SAML connector development contributed to an approximately 350% increase in connector output over five months.',
    metric: '7–8 months',
    metricLabel: 'Engineering effort saved · author-reported',
    detail: 'Consulting engagement through Gorilla Logic. Outcomes are the author’s published account, not an independent benchmark.',
  },
];

export const principles = [
  {
    title: 'Own the problem, not just the ticket.',
    text: 'Understand the problem, define the solution, architect it, build it, validate it and iterate. I am comfortable challenging assumptions and working through ambiguity.',
  },
  {
    title: 'Do the right work in the right place.',
    text: 'Performance often comes from moving work, not doing less of it: aggregation to the database, computation to a worker, caching at the request layer.',
  },
  {
    title: 'Build the foundation once.',
    text: 'Shared primitives, typed contracts and design systems let a team deliver more without adding complexity. My open-source libraries come from the same instinct.',
  },
  {
    title: 'Make quality part of the system.',
    text: 'If correctness depends on everyone remembering every edge case, the process is fragile. I turn those risks into tests, validation and delivery controls.',
  },
  {
    title: 'Use AI with verification.',
    text: 'I build AI workflows around clear constraints, code review and automated tests, with engineering ownership of every decision and release.',
  },
];

export interface Role {
  years: string;
  company: string;
  title?: string;
  note: string;
}

export const history: Role[] = [
  {
    years: 'May 2025 — present',
    company: 'Vonage',
    title: 'Senior product engineer',
    note: 'Video Developer Platform. Authored the product and architecture strategy for a system to build and deploy video applications at several levels of integration: ready-to-use apps, no-code deployment, and reusable npm packages on the same core. Hands-on across a React reference app, API and domain design, reusable packages, generated OpenAPI contracts, integration testing, monorepo architecture and CI/CD.',
  },
  {
    years: 'Nov 2024 — Feb 2025',
    company: 'Front',
    title: 'Senior software engineer',
    note: 'After the acquisition of Idiomatic: AI product integration and customer-intelligence work.',
  },
  {
    years: '2022 — 2024',
    company: 'Idiomatic',
    title: 'Senior product engineer',
    note: 'Report Builder, performance architecture, Nx monorepo and design system.',
  },
  {
    years: '2021 — 2022',
    company: 'ReMatter',
    title: 'Senior product engineer',
    note: 'Shared mobile architecture and the driver app foundation.',
  },
  {
    years: '2020 — 2021',
    company: 'OMNi (Costa Rica)',
    title: 'Consultant → technical lead',
    note: 'Started as a part-time React Native consultant, then Technical Lead of two teams of roughly 15–20 people. Feature flags, hot fixes and idempotent request processing for unreliable mobile networks.',
  },
  {
    years: '2019 — 2020',
    company: 'Gorilla Logic, on the JumpCloud engagement',
    title: 'Consulting engineer',
    note: 'Consultancy work embedded in JumpCloud’s directory platform team. This ran partly in parallel with the OMNi consulting above.',
  },
  {
    years: '2019',
    company: 'Intertec International',
    title: 'Consulting engineer',
    note: 'Education-platform integrations with Google services, and MuleSoft sync services for an e-commerce platform.',
  },
  { years: '2018 — 2019', company: 'Agilence', note: 'Retail analytics and reporting platform.' },
  {
    years: '2017 — 2018',
    company: 'Fragomen',
    note: 'Enterprise systems: database performance and Web Worker data processing, which later inspired easy-web-worker.',
  },
  {
    years: '2015 — 2017',
    company: 'MDG Developers Group',
    note: 'An internal ASP.NET application framework, and client platforms including a business system for Televisora de Costa Rica.',
  },
];
