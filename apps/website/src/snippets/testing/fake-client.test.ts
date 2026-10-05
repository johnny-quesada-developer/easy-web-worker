import type { WorkerProxy } from 'easy-web-worker/createWorker';
import type { PricingWorker } from './pricing.worker';

/** The code under test receives the worker, so a test can hand it a fake one. */
const formatTotal = async (pricing: Pick<WorkerProxy<PricingWorker>, 'total'>, prices: number[]) => {
  const value = await pricing.total(prices.map((price) => ({ price, quantity: 1 })));

  return `$${value.toFixed(2)}`;
};

describe('formatTotal', () => {
  it('formats the total computed by the worker', async () => {
    const total = vi.fn().mockResolvedValue(12.5);

    expect(await formatTotal({ total }, [10, 2.5])).toBe('$12.50');
    expect(total).toHaveBeenCalledWith([
      { price: 10, quantity: 1 },
      { price: 2.5, quantity: 1 },
    ]);
  });
});
