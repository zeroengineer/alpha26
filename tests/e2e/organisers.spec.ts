import { test, expect } from '@playwright/test';

test.describe('organisers', () => {
  test('track record lists the previous events without a slider', async ({ page }) => {
    await page.goto('/#track-record');
    await expect(page.locator('#track-record [data-event]')).toHaveCount(4);
    await expect(page.locator('[data-slider]')).toHaveCount(0);
  });

  test('frames collage opens a lightbox that closes on Escape', async ({ page }) => {
    await page.goto('/#gallery');
    const first = page.locator('[data-lightbox-open]').first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-island-ready~="#organisers"]');
    await first.click();
    const dialog = page.locator('[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-count]')).toHaveText(/^01 \/ \d\d$/);
    await page.locator('[data-lightbox-next]').click();
    await expect(page.locator('[data-lightbox-count]')).toHaveText(/^02 \//);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
