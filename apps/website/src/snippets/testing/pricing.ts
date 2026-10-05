export interface Line {
  price: number;
  quantity: number;
}

/** Ordinary functions: nothing here knows about workers. */
export const total = (lines: Line[]) =>
  lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

export const average = (lines: Line[]) => (lines.length ? total(lines) / lines.length : 0);
