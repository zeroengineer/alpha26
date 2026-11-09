import { test, expect } from '@playwright/test';

test.describe('hero sequence', () => {
  test('wheel steps through the three scenes, then releases to the page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'wheel gestures are desktop only');
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
    await page.waitForTimeout(2500); // entrance timeline
    const count = page.locator('[data-step-count]');
    await expect(count).toHaveText('01');
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 400);
    await expect(count).toHaveText('02', { timeout: 4_000 });
    await expect(page.locator('[data-hero-scene="1"]')).toBeVisible();
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 400);
    await expect(count).toHaveText('03', { timeout: 4_000 });
    await expect(page.locator('[data-statement] .wipe__text')).toBeVisible();
    await page.waitForTimeout(1500);
    // page must not have scrolled during the sequence
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(2);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 6_000 }).toBeGreaterThan(200);
  });

  test('keyboard steps the sequence', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard is desktop only');
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
    await page.waitForTimeout(2500);
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-step-count]')).toHaveText('02', { timeout: 4_000 });
    await page.waitForTimeout(1500);
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('[data-step-count]')).toHaveText('01', { timeout: 4_000 });
  });

  test('hud readouts exist on desktop and are hidden on mobile', async ({ page, isMobile }) => {
    await page.goto('/');
    const hud = page.locator('[data-hud] [data-hud-line]').first();
    if (isMobile) await expect(hud).toBeHidden();
    else await expect(hud).toBeAttached();
  });
});

test.describe('hero under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('shows the facts and statement scenes in flow without a sequence', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-hero-scene="1"]')).toBeVisible();
    await expect(page.locator('[data-hero-scene="2"]')).toBeVisible();
    await expect(page.locator('[data-hero-progress]')).toBeHidden();
  });
});
