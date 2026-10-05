// Every browser import of react-global-state-hooks resolves here (see astro.config.mjs), so the debug
// entry is loaded before any store is created and the stores of the site show up in the DevTools extension.
import 'react-global-state-hooks/debug';

export * from 'react-global-state-hooks';
