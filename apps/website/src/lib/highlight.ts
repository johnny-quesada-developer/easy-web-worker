import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import typescript from 'shiki/langs/typescript.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import javascript from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import bash from 'shiki/langs/bash.mjs';
import css from 'shiki/langs/css.mjs';
import type { ThemeRegistration, ThemeRegistrationAny } from 'shiki/core';
import { CODE_THEMES, CSS_VARIABLE_PREFIX, shikiThemes } from './code-themes.mjs';

export type CodeLanguage = 'ts' | 'tsx' | 'js' | 'json' | 'bash' | 'css';

// Synchronous highlighter so React components can highlight while they render to static HTML at build
// time. It is only imported by components that are never hydrated, so none of this ships to the browser.
const highlighter = createHighlighterCoreSync({
  themes: CODE_THEMES.map((entry) => entry.theme as ThemeRegistration),
  langs: [typescript, tsx, javascript, json, bash, css],
  engine: createJavaScriptRegexEngine(),
});

export function highlight(code: string, lang: CodeLanguage): string {
  return highlighter.codeToHtml(code.trimEnd(), {
    lang,
    themes: shikiThemes as Record<string, ThemeRegistrationAny>,
    defaultColor: false,
    cssVariablePrefix: CSS_VARIABLE_PREFIX,
  });
}
