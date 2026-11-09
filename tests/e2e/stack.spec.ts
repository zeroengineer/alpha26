import { test, expect } from '@playwright/test';

test('scenes stack: a scrolled-past section is pinned beneath the next one', async ({ page, isMobile }) => {
  await page.goto('/#organisers');
  await page.waitForFunction(() => document.documentElement.dataset.revealed === 'true', null, { timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('organisers')!.getBoundingClientRect().top)), { timeout: 10_000 }).toBeLessThan(140);
  // About has been scrolled past → it lives in a pin-spacer and is scaled down while covered
  await expect(page.locator('.pin-spacer #about')).toHaveCount(1);
  const covered = await page.evaluate(() => {
    const about = document.getElementById('about')!;
    const m = new DOMMatrixReadOnly(getComputedStyle(about).transform);
    return { scale: m.a, opacity: Number(getComputedStyle(about).opacity), z: getComputedStyle(about).zIndex };
  });
  expect(covered.scale).toBeLessThan(1);
  expect(covered.opacity).toBeLessThan(1);
  // nav still reaches a covered section
  if (isMobile) {
    await page.locator('header [data-nav-toggle]').click();
    await page.locator('#menu [data-nav-link="about"]').click();
  } else {
    await page.locator('header nav [data-nav-link="about"]').click();
  }
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById('about')!.getBoundingClientRect().top)), { timeout: 8_000 }).toBeLessThanOrEqual(1);
});
