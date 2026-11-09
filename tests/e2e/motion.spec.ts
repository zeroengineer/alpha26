import { test, expect } from '@playwright/test';

test.describe('motion safety', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion skips the preloader and the pinned hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-preloader]')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#hero [data-title] .wipe__text')).toBeVisible();
    await expect(page.locator('#hero [data-caption]')).toHaveText(/BUILT TO BECOME/);
  });
});

test('preloader reveals the hero copy', async ({ page }) => {
  await page.goto('/?pre=1');
  await expect(page.locator('[data-preloader]')).toBeVisible();
  await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
  await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('#hero [data-caption]')).toHaveText('IEEE MSS ALPHA’26 - BUILT TO BECOME', { timeout: 5_000 });
});
