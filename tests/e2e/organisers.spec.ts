import { test, expect } from '@playwright/test';

test.describe('organisers', () => {
  test('track record slider advances and updates the counter', async ({ page }) => {
    await page.goto('/#track-record');
    const slider = page.locator('[data-slider]');
    await slider.scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-island-ready~="#organisers"]');
    await expect(page.locator('[data-slider-current]')).toHaveText('01');
    await expect(page.locator('[data-slider-prev]')).toBeDisabled();
    await page.locator('[data-slider-next]').click();
    await expect(page.locator('[data-slider-current]')).toHaveText('02');
    await expect(page.locator('[data-slide].is-active')).toHaveAttribute('aria-label', /^2 of/);
  });

  test('gallery opens a lightbox that closes on Escape', async ({ page }) => {
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
