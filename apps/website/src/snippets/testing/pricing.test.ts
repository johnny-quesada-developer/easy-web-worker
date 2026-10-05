import { average, total } from './pricing';

describe('pricing', () => {
  const lines = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 4 },
  ];

  it('adds every line', () => {
    expect(total(lines)).toBe(40);
  });

  it('averages the lines', () => {
    expect(average(lines)).toBe(20);
    expect(average([])).toBe(0);
  });
});
