import { rgshDark, rgshLight } from './shiki-theme.mjs';
import { contrast } from './contrast';

const themes = [rgshLight, rgshDark];

const pairs = themes.flatMap((theme) => {
  const background = theme.colors['editor.background'];
  const colours = [
    ...new Set(theme.tokenColors.map((rule) => rule.settings.foreground).filter(Boolean)),
    theme.colors['editor.foreground'],
  ];

  return colours.map((colour) => [theme.name, colour as string, background] as const);
});

describe('code theme contrast', () => {
  it.each(pairs)('%s: %s on the code background meets 4.5:1', (_name, colour, background) => {
    expect(contrast(colour, background)).toBeGreaterThanOrEqual(4.5);
  });
});
