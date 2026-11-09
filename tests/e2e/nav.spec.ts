import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test('renders only the launched sections and their links', async ({ page }) => {
    await page.goto('/');
    for (const id of ['hero', 'about', 'organisers', 'contact']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    // flagged-off sections must not exist in the DOM at all
    for (const id of ['speakers', 'venue', 'partners']) {
      await expect(page.locator(`#${id}`)).toHaveCount(0);
      await expect(page.locator(`[data-nav-link="${id}"]`)).toHaveCount(0);
    }
  });

  test('nav link scrolls to its section', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 15_000 });
    await page.waitForSelector('header[data-island-ready]', { state: 'attached' });
    if (isMobile) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.locator('#menu [data-nav-link="organisers"]').click();
    } else {
      await page.locator('header [data-nav-link="organisers"]').click();
    }
    await expect
      .poll(async () => page.evaluate(() => Math.round(document.getElementById('organisers')!.getBoundingClientRect().top)), { timeout: 8_000 })
      .toBeLessThan(140);
    await expect(page.locator('header [data-nav-link="organisers"]')).toHaveClass(/is-active/);
  });

  test('mobile menu opens, traps Escape, and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 15_000 });
    await page.waitForSelector('header[data-island-ready]', { state: 'attached' });
    const toggle = page.getByRole('button', { name: 'Menu' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#menu')).toBeHidden();
  });
});
