import { test as base, expect } from '@playwright/test';

const PAGE_ERRORS_EXPECTED = 'page-errors-expected';

type Fixtures = {
  /**
   * Uncaught errors and unhandled rejections of the page, the uncaught errors of the workers are included.
   * Every test fails if there is any, unless the test calls expectPageErrors.
   */
  pageErrors: Error[];
};

export const test = base.extend<Fixtures>({
  pageErrors: [
    async ({ page }, use, testInfo) => {
      const pageErrors: Error[] = [];

      page.on('pageerror', (error) => pageErrors.push(error));

      await page.goto('/');
      await page.waitForFunction(() => Boolean(window.easyWebWorker && window.e2e));

      await use(pageErrors);

      const areErrorsExpected = testInfo.annotations.some(
        ({ type }) => type === PAGE_ERRORS_EXPECTED
      );

      if (areErrorsExpected) {
        expect(pageErrors.length, 'expected errors in the page').toBeGreaterThan(0);

        return;
      }

      expect(
        pageErrors.map((error) => error.message),
        'unexpected errors in the page'
      ).toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * For the tests that make a worker throw on purpose: the browser reports that error in the page.
 */
export const expectPageErrors = () => {
  test.info().annotations.push({ type: PAGE_ERRORS_EXPECTED });
};

export { expect };
