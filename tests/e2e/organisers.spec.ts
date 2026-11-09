import { test, expect } from '@playwright/test';

test.describe('organisers', () => {
  test('frames carry event details and open a lightbox with them', async ({ page }) => {
    await page.goto('/#gallery');
    const first = page.locator('[data-lightbox-open]').first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-island-ready~="#organisers"]');
    await expect(first.locator('.frame__meta')).toContainText('Previous Event One');
    await expect(first.locator('.frame__meta')).toContainText('2025');
    await first.click();
    const dialog = page.locator('[data-lightbox]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-lightbox-event]')).toHaveText('Previous Event One — 2025');
    await expect(page.locator('[data-lightbox-cap]')).toContainText('300+ participants');
    await expect(page.locator('[data-lightbox-count]')).toHaveText(/^01 \/ \d\d$/);
    await page.locator('[data-lightbox-next]').click();
    await expect(page.locator('[data-lightbox-count]')).toHaveText(/^02 \//);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('the team block is descriptive content, with no past-events slider', async ({ page }) => {
    await page.goto('/#organisers');
    await expect(page.locator('#organisers [data-team-card]')).toHaveCount(2);
    await expect(page.locator('#organisers .team__focus li')).toHaveCount(3);
    await expect(page.locator('#organisers [data-slider]')).toHaveCount(0);
    await expect(page.locator('#track-record')).toHaveCount(0);
  });
});
