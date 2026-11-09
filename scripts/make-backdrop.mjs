// Builds the stage's crowd backdrop from the Figma poster raster: the α (and its glow) is removed
// using the exact GFS Didot outline at the poster's α position, filled with a dark blur of its
// surroundings. The live 3D α covers that region in the poster view, so the crowd, rings and haze
// stay exactly as designed. Run: node scripts/make-backdrop.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const src = 'src/assets/figma/alpha-crowd.png';
const out = 'src/assets/stage/backdrop.webp';
const POSTER = { alphaH: 0.54, alphaCx: 0.508, alphaCy: 0.491 };
const ts = readFileSync('src/assets/alpha/alpha-path.ts', 'utf8');
const d = ts.match(/ALPHA_PATH = '([^']+)'/)[1];
const [vw, vh] = ts.match(/w: (\d+), h: (\d+)/).slice(1).map(Number);

const W = 1080, H = 1440;
const base = sharp(src).resize(W, H, { fit: 'fill' });
const s = (POSTER.alphaH * H) / vh;
const x0 = POSTER.alphaCx * W - (vw * s) / 2;
const y0 = POSTER.alphaCy * H - (vh * s) / 2;
// mask: the α, dilated (stroke) to swallow the chrome's glow and bevel highlights
const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="black"/>
  <path d="${d}" transform="translate(${x0} ${y0}) scale(${s})" fill="white" stroke="white" stroke-width="${46 / s}" stroke-linejoin="round"/>
</svg>`;
const mask = await sharp(Buffer.from(maskSvg)).blur(10).greyscale().raw().toBuffer();
const orig = await base.clone().greyscale().raw().toBuffer();
// fill: the poster with the α region removed, heavily blurred, darkened
const holed = Buffer.from(orig.map((v, i) => Math.round(v * (1 - mask[i] / 255))));
const blurred = await sharp(holed, { raw: { width: W, height: H, channels: 1 } }).blur(38).raw().toBuffer();
const blurW = await sharp(Buffer.from(mask.map((m) => 255 - m)), { raw: { width: W, height: H, channels: 1 } }).blur(38).raw().toBuffer();
const outBuf = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  const m = mask[i] / 255;
  const fill = blurW[i] > 2 ? Math.min(255, (blurred[i] / blurW[i]) * 255 * 0.4) : 0; // normalised blur = inpaint
  outBuf[i] = Math.round(orig[i] * (1 - m) + fill * m);
}

// Remove the glass slats' edge lines (the live scene draws its own slats): a thin bright line is a
// pixel much brighter than the median of its neighbours across the line. Vertical-ish edges use a
// horizontal window, the slats' top/bottom edges a vertical one. Two passes catch anti-aliasing.
const median = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a[a.length >> 1]; };
function deline(buf, horizontal, r, thresh) {
  const out = Buffer.from(buf);
  for (let y = r; y < H - r; y++) for (let x = r; x < W - r; x++) {
    const i = y * W + x;
    const win = [];
    for (let k = -r; k <= r; k++) win.push(horizontal ? buf[i + k] : buf[i + k * W]);
    const med = median(win);
    if (buf[i] - med > thresh) out[i] = med;
  }
  return out;
}
let clean = outBuf;
for (let pass = 0; pass < 2; pass++) {
  clean = deline(clean, true, 5, 28);
  clean = deline(clean, false, 5, 34);
}
outBuf.set(clean);
await sharp(outBuf, { raw: { width: W, height: H, channels: 1 } }).webp({ quality: 82 }).toFile(out);
console.log('wrote', out);
