import { test, expect } from '@playwright/test';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the poster and copy immediately and keeps the α stage static', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero [data-caption]')).toBeVisible();
    await expect(page.locator('#hero [data-title]')).toHaveText('12 – 13 December 2026');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-stage]')).not.toHaveClass(/is-webgl/);
    await expect(page.locator('.stage__fallback')).toBeVisible();
    // no scroll-pinning anywhere
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
  });
});

test('software WebGL keeps the static α fallback', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await page.mouse.move(400, 400);
  await page.waitForTimeout(2500);
  await expect(page.locator('[data-stage]')).not.toHaveClass(/is-webgl/);
  await expect(page.locator('.stage__fallback')).toBeVisible();
});

test('phones get the light α outline, never WebGL or three.js', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  const scripts: string[] = [];
  page.on('request', (r) => { if (r.resourceType() === 'script') scripts.push(r.url()); });
  await page.goto('/?gl=1'); // even when WebGL is forced
  await expect(page.locator('[data-stage]')).toHaveClass(/is-lite/, { timeout: 15_000 });
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-stage]')).not.toHaveClass(/is-webgl/);
  await expect(page.locator('.stage__fallback')).toBeVisible();
  expect(scripts.filter((u) => /three|EffectComposer|UnrealBloom/i.test(u))).toEqual([]);
});

test('there is no preloader; the page signals ready on its own', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-preloader]')).toHaveCount(0);
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 10_000 });
});

test('the α stage mounts WebGL and visits every station in order', async ({ page, isMobile }) => {
  test.skip(isMobile, 'headless mobile emulation has no reliable WebGL');
  // headless Chromium renders with SwiftShader, which the stage skips by default; ?gl=1 forces it
  await page.goto('/?gl=1');
  await page.mouse.move(400, 400);
  await expect(page.locator('[data-stage]')).toHaveClass(/is-webgl/, { timeout: 15_000 });
  const stations = await page.locator('[data-station]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.station));
  expect(stations).toEqual(['hero', 'intro', 'about', 'pillars', 'statement', 'team', 'frames', 'contact']);
});

test('the hero poster stays centred on an ultra-wide screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 10_000 });
  await page.waitForTimeout(2500);
  const centre = await page.locator('.layer--base').evaluate((el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; });
  expect(Math.abs(centre - 1280)).toBeLessThan(40);
});

test.describe('opening loader', () => {
  test('draws, hands over to the hero, removes itself, and is skipped on reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-loader]')).toHaveCount(1);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout: 15_000 });
    await expect(page.locator('[data-loader]')).toHaveCount(0, { timeout: 6_000 });
    await expect(page.locator('#hero [data-title]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-loader]')).toHaveCount(0);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('never shows', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-loader]')).toHaveCount(0);
    });
  });
});

test('the scale ruler is gone', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-ruler]')).toHaveCount(0);
});
