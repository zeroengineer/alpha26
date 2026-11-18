import { test, expect } from '@playwright/test';

/** Runs against a build with ALPHA_FLAGS=all (see playwright.launched.config.ts). */
test.describe('launched build', () => {
  test('renders every section and nav link in canonical order', async ({ page }) => {
    await page.goto('/');
    // The hero is wrapped in a ScrollTrigger pin-spacer, so match top-level sections by id, not by parent.
    const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id).filter((id) => !id.includes('-')));
    expect(ids).toEqual(['hero', 'about', 'speakers', 'venue', 'partners', 'organisers', 'contact']);
    const labels = await page.locator('header nav a').allTextContents();
    expect(labels).toEqual(['Home', 'About', 'Speakers', 'Venue', 'Partners', 'Organisers', 'Contact']);
  });

  test('hero shows dates and the register CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero [data-title]')).toHaveText('12 – 13 December 2026');
    await expect(page.locator('#hero [data-cta]')).toHaveText('Register');
  });

  test('speakers and sessions render from the collections', async ({ page }) => {
    await page.goto('/#lineup');
    await expect(page.locator('#speakers [data-slide]')).toHaveCount(4);
    await expect(page.locator('#speakers [data-slider]')).toHaveCount(0);
    await expect(page.locator('#sessions [data-session]')).toHaveCount(5);
  });

  test('partners render sponsor tiers and the collaborators marquee', async ({ page }) => {
    await page.goto('/#partners');
    await expect(page.locator('#partners [data-tier]')).toHaveCount(3);
    await expect(page.locator('#partners [data-marquee]')).toHaveCount(1);
  });
});
