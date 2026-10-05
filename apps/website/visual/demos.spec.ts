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

    await expect(page.getByTestId('worker-result')).toHaveText('39,088,169');
    await expect(page.getByTestId('worker-frames')).not.toHaveText('not run');

    await page.getByRole('button', { name: 'Run on the main thread' }).click();

    await expect(page.getByTestId('main-result')).toHaveText('39,088,169');
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

  test('worker pool: four workers share the tasks', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('examples/worker-pool/');
    await page.getByRole('button', { name: /Run 8 tasks/ }).click();

    await expect(page.getByTestId('pool-elapsed')).toHaveText(/\d ms$/, { timeout: 30_000 });

    const names = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7, 8].map((task) => page.getByTestId(`task-${task}`).textContent()),
    );

    expect([...new Set(names)].sort()).toEqual(['worker', 'worker-1', 'worker-2', 'worker-3']);
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
    await expect(page.getByTestId('worker-result')).toHaveText('39,088,169');

    await page.getByRole('button', { name: /Run 8 tasks/ }).click();
    await expect(page.getByTestId('pool-elapsed')).toHaveText(/\d ms$/, { timeout: 30_000 });
    expect(errors).toEqual([]);
  });
});
