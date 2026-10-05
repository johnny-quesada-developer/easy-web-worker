import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrast } from './contrast';

const css = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

const palette = (selector: string): string => {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`palette ${selector} not found`);
  const open = css.indexOf('{', start);
  return css.slice(open, css.indexOf('}', open));
};

const light = palette('@theme static');
const dark = palette('.dark {');

const read = (block: string, name: string): string => {
  const match = block.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --color-${name} not found`);
  return match[1];
};

const token = (name: string): string => read(light, name);
const darkToken = (name: string): string => read(dark, name);

// [foreground, background, minimum ratio]. 4.5 = WCAG AA body text, 3 = AA for large text / UI.
const pairs: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'soft', 4.5],
  ['ink', 'green-soft', 4.5],
  ['ink', 'blue-soft', 4.5],
  ['muted', 'paper', 4.5],
  ['muted', 'soft', 4.5],
  ['muted', 'surface', 4.5],
  ['green', 'paper', 4.5],
  ['green', 'green-soft', 4.5],
  ['green', 'soft', 4.5],
  ['blue', 'paper', 4.5],
  ['blue', 'blue-soft', 4.5],
  ['amber', 'amber-soft', 4.5],
  ['red', 'red-soft', 4.5],
  ['red', 'paper', 4.5],
  ['terminal-text', 'terminal', 4.5],
  ['terminal-muted', 'terminal', 4.5],
  ['paper', 'ink', 4.5],
  ['green', 'paper', 3],
];

describe('design token contrast', () => {
  it.each(pairs)('%s on %s meets %s:1', (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it.each(pairs)('dark %s on %s meets %s:1', (fg, bg, min) => {
    expect(contrast(darkToken(fg), darkToken(bg))).toBeGreaterThanOrEqual(min);
  });
});
