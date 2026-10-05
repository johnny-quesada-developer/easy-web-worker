# Visual regression baselines

Screenshot baselines for every page of the site, plus behavior tests for the live examples. The
baselines exist so a styling change can be proven to leave the rendered site identical.

## Running

```bash
yarn test:visual          # build, then compare against the baselines
yarn test:visual:run      # compare without rebuilding (dist/ must be current)
yarn test:visual:update   # build, then rewrite the baselines
yarn test:visual:report   # open the HTML report of the last run
```

From the workspace root: `nx run website:test:visual`.

## What is covered

`site.spec.ts` reads `dist/` and takes a full-page screenshot of every built page, so a new page is
covered as soon as it builds. `404.html` is reached by requesting an unknown path.

`demos.spec.ts` is different: it takes no screenshots. It runs every live example for real, starting
native Workers in the browser against the built site and the built package, and asserts the results
(the computed values, a cancellation, the workers of a pool, a transferred buffer). It also fails on any
error logged by the page.

Each spec runs in two projects, `desktop` (1280×900) and `mobile` (390×844).

## Determinism

- The browser context sets `prefers-reduced-motion: reduce`. `styles/base.css` stops every animation
  under it.
- The live examples are idle when a page loads, so their measured values (times, frame counts) are
  never part of a screenshot.
- The suite serves the production build through `scripts/visual-server.mjs`. `astro preview` detaches
  into a background daemon, which Playwright's `webServer` cannot manage.
- `maxDiffPixelRatio` is `0.03`: up to 3% of a screenshot's pixels may differ before it fails.

## Local only

No CI job runs this suite, on purpose. `deploy-website.yml` runs `website:test`, `ts-check`, `lint`,
`build` and `check:links`; `test:visual` is a separate nx target it never invokes, and its
`yarn install --ignore-scripts` keeps Playwright from downloading browsers.

The baselines are macOS-rendered. The site uses the system font stack, which rasterizes differently
on Linux, so a Linux runner would need its own `--update-snapshots` in a pinned container before the
suite could ever move into CI.

## Migrating styles with this suite

1. `yarn test:visual` on a clean tree — confirm 74 passing.
2. Migrate one area's CSS.
3. `yarn test:visual:run` — every failure is a real visual change. `yarn test:visual:report` shows
   the expected/actual/diff triple.
4. Fix, or accept an intended change with `yarn test:visual:update` and review the PNG diff.
