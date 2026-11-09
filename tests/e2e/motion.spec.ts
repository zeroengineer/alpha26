import { test, expect } from '@playwright/test';

test.describe('motion safety', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion skips the preloader and the pinned hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-preloader]')).toHaveCount(0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#hero [data-title] .wipe__text')).toBeVisible();
    await expect(page.locator('#hero [data-caption]')).toHaveText(/BUILT TO BECOME/);
    // the WebGL background never mounts under reduced motion; the CSS fallback stays
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-bg]')).not.toHaveClass(/is-webgl/);
  });
});

test('webgl background mounts after the reveal', async ({ page, isMobile }) => {
  test.skip(isMobile, 'headless mobile emulation has no reliable WebGL');
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
  await expect(page.locator('[data-bg]')).toHaveClass(/is-webgl/, { timeout: 15_000 });
  await expect(page.locator('[data-bg-canvas]')).toHaveClass(/is-on/, { timeout: 5_000 });
});

test('preloader reveals the hero copy', async ({ page }) => {
  await page.goto('/?pre=1');
  await expect(page.locator('[data-preloader]')).toBeVisible();
  await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
  await expect(page.locator('[data-preloader]')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('#hero [data-caption]')).toHaveText('IEEE MSS ALPHA’26 - BUILT TO BECOME', { timeout: 5_000 });
});
