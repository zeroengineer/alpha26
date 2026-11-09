// Renders the hero's first-paint still from the live α stage itself, so the hand-off from image to
// live scene is pixel-identical. The viewport is the poster's own frame (1080×1440), where the stage
// fits the α exactly as the poster has it. Needs the dev server running (npm run dev) and a GPU
// (headless works via SwiftShader but slower). Run: node scripts/capture-hero.mjs
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const url = process.env.URL ?? 'http://localhost:4321/?gl=1';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'load' });
await page.keyboard.press('Shift'); // first interaction starts the stage without moving the pointer
await page.waitForSelector('[data-stage][data-stage-ready]', { timeout: 60_000 });
await page.addStyleTag({ content: 'body > *:not([data-stage]) { visibility: hidden !important; } .stage__fog { display: none !important; }' });
await page.waitForTimeout(2500);
const png = await page.locator('[data-stage-canvas]').screenshot();
await sharp(png).greyscale().png({ compressionLevel: 9 }).toFile('src/assets/figma/alpha-render.png');
await browser.close();
console.log('wrote src/assets/figma/alpha-render.png');
