/**
 * The site palette as a Shiki theme, in both appearances: keywords in the composition blue, strings
 * in the brand green, calls and JSX tags in the warm red, numbers in amber, comments muted. Shared by
 * the build-time highlighter (src/lib/highlight.ts) and Astro's fenced-code highlighting
 * (astro.config.mjs). src/lib/shiki-theme.test.ts checks every colour against its own background.
 */
const ink = '#1b2320';
const muted = '#66716a';
const blue = '#39528c';
const green = '#1f6446';
const red = '#94382f';
const amber = '#7a5a1c';
const teal = '#215f62';
const background = '#f7f8f6';

export const rgshLight = {
  name: 'rgsh-light',
  type: 'light',
  colors: { 'editor.background': background, 'editor.foreground': ink },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: muted, fontStyle: 'italic' } },
    {
      scope: ['string', 'string.template', 'punctuation.definition.string', 'constant.other.symbol'],
      settings: { foreground: green },
    },
    { scope: ['constant.character.escape', 'string.regexp'], settings: { foreground: amber } },
    {
      scope: [
        'keyword',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'storage',
        'storage.type',
        'storage.modifier',
        'variable.language.this',
        'variable.language.super',
      ],
      settings: { foreground: blue, fontStyle: 'bold' },
    },
    { scope: ['constant.numeric', 'constant.language', 'constant.language.boolean'], settings: { foreground: amber } },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'variable.function'],
      settings: { foreground: red },
    },
    { scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: red } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: teal } },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.name.namespace'],
      settings: { foreground: teal },
    },
    { scope: ['variable', 'variable.other.readwrite', 'meta.object-literal.key', 'support.variable.property'], settings: { foreground: ink } },
    { scope: ['variable.parameter'], settings: { foreground: ink } },
    { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: muted } },
  ],
};

const darkInk = '#f1f0e9';
const darkMuted = '#aaa89e';
const darkBlue = '#899fc8';
const darkGreen = '#83ad8d';
const darkRed = '#d8877d';
const darkAmber = '#cba66a';
const darkTeal = '#8fb3ae';
const darkBackground = '#1a1a17';

export const rgshDark = {
  name: 'rgsh-dark',
  type: 'dark',
  colors: { 'editor.background': darkBackground, 'editor.foreground': darkInk },
  tokenColors: rgshLight.tokenColors.map((rule) => ({
    ...rule,
    settings: {
      ...rule.settings,
      foreground: {
        [ink]: darkInk,
        [muted]: darkMuted,
        [blue]: darkBlue,
        [green]: darkGreen,
        [red]: darkRed,
        [amber]: darkAmber,
        [teal]: darkTeal,
      }[rule.settings.foreground],
    },
  })),
};
