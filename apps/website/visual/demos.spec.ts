import { expect, test, type Page } from '@playwright/test';

/**
 * The live examples, exercised for real: every test starts native Workers in the browser, against the
 * built site and the built package. These are behavior checks, not screenshots.
 */
const collectErrors = (page: Page) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  return errors;
};

test.describe('live examples', () => {
  test('keep the page responsive: same result on both threads', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/keep-the-page-responsive/');
    await page.getByRole('button', { name: 'Run in a Worker' }).click();

    await expect(page.getByTestId('worker-result')).toHaveText('102,334,155', { timeout: 30_000 });
    await expect(page.getByTestId('worker-frames')).not.toHaveText('not run');

    await page.getByRole('button', { name: 'Run on the main thread' }).click();

    await expect(page.getByTestId('main-result')).toHaveText('102,334,155', { timeout: 30_000 });
    await expect(page.getByTestId('main-frozen')).toHaveText(/\d ms$/);
    expect(errors).toEqual([]);
  });

  test('progress and cancellation: completes, then cancels', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/progress-and-cancellation/');
    await page.getByRole('radio', { name: '2,000,000', exact: true }).check();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByTestId('primes-status')).toHaveText('done', { timeout: 30_000 });
    await expect(page.getByTestId('primes-found')).toHaveText('148,933');
    await expect(page.getByTestId('primes-progress')).toHaveText('100%');

    await page.getByRole('radio', { name: '20,000,000', exact: true }).check();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('primes-progress')).not.toHaveText('0%');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByTestId('primes-status')).toHaveText('canceled');
    await expect(page.locator('.workbench').getByRole('status')).toContainText('Canceled by user');
    expect(errors).toEqual([]);
  });

  test('worker pool: three workers share the segments and agree with one worker', async ({ page }) => {
    const errors = collectErrors(page);
    const answers = ['410,011 · 448 steps', '837,799 · 524 steps', '1,117,065 · 527 steps'];

    await page.goto('examples/worker-pool/');
    await page.getByRole('radio', { name: '1,500,000', exact: true }).check();
    await page.getByRole('button', { name: 'Run with 3 workers' }).click();

    await expect(page.getByTestId('pool-elapsed-3')).toHaveText(/\d ms$/, { timeout: 30_000 });

    const segments = [1, 2, 3];

    expect(await Promise.all(segments.map((segment) => page.getByTestId(`segment-${segment}`).textContent()))).toEqual(answers);

    const names = await Promise.all(segments.map((segment) => page.getByTestId(`segment-worker-${segment}`).textContent()));

    expect([...names].sort()).toEqual(['worker', 'worker-1', 'worker-2']);

    await page.getByRole('button', { name: 'Run with 1 worker' }).click();
    await expect(page.getByTestId('pool-elapsed-1')).toHaveText(/\d ms$/, { timeout: 30_000 });

    expect(await Promise.all(segments.map((segment) => page.getByTestId(`segment-${segment}`).textContent()))).toEqual(answers);
    await expect(page.getByTestId('pool-speedup')).toContainText('faster');
    expect(errors).toEqual([]);
  });

  test('transferable buffers: a transfer empties the sender, a copy does not', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/transferable-buffers/');
    await page.getByRole('radio', { name: '16 MB', exact: true }).check();

    await page.getByRole('button', { name: 'Transfer it' }).click();
    await expect(page.getByTestId('transfer-kept')).toHaveText('0 MB');
    await expect(page.getByTestId('transfer-returned')).toHaveText('16 MB');

    await page.getByRole('button', { name: 'Send a copy' }).click();
    await expect(page.getByTestId('copy-kept')).toHaveText('16 MB');
    await expect(page.getByTestId('copy-returned')).toHaveText('16 MB');
    expect(errors).toEqual([]);
  });

  test('worker without a file: analyzes the text as it changes', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/worker-without-a-file/');
    await expect(page.getByTestId('text-words')).not.toHaveText('…');

    await page.getByRole('textbox').fill('worker worker thread');

    await expect(page.getByTestId('text-words')).toHaveText('3');
    await expect(page.getByTestId('text-unique')).toHaveText('2');
    await expect(page.getByTestId('text-frequent')).toContainText('worker × 2');
    expect(errors).toEqual([]);
  });

  test('home: the live demos run on the landing page', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('');
    await page.getByRole('button', { name: 'Run in a Worker' }).click();
    await expect(page.getByTestId('worker-result')).toHaveText('102,334,155', { timeout: 30_000 });

    await page.getByRole('radio', { name: '1,500,000', exact: true }).check();
    await page.getByRole('button', { name: 'Run with 3 workers' }).click();
    await expect(page.getByTestId('pool-elapsed-3')).toHaveText(/\d ms$/, { timeout: 30_000 });
    expect(errors).toEqual([]);
  });
});
