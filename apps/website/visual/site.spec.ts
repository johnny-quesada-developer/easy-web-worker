import { expect, test, type Page } from '@playwright/test';
import { routes } from './routes';

const masks = (page: Page) => [page.locator('video')];

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.toast').waitFor({ state: 'attached' });
}

for (const route of routes()) {
  test(route.name, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: 'load' });

    expect(response?.status(), `${route.path} should be served`).toBe(200);
    await settle(page);

    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true, mask: masks(page) });
  });
}

test('not-found', async ({ page }) => {
  await page.goto('this-page-does-not-exist/', { waitUntil: 'load' });
  await settle(page);

  await expect(page).toHaveScreenshot('not-found.png', { fullPage: true, mask: masks(page) });
});
