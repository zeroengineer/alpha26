// Generates public/og.jpg (1200×630) from the poster artwork: black ground, poster centred, caption.
// Run with: node scripts/og-image.mjs
import sharp from 'sharp';

const W = 1200, H = 630;
const poster = await sharp('src/assets/figma/alpha-crowd.png').resize({ height: H, fit: 'inside' }).toBuffer();
const meta = await sharp(poster).metadata();
const left = Math.round((W - meta.width) / 2);
const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="0.35" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <text x="600" y="78" text-anchor="middle" font-family="Sora, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" letter-spacing="11" fill="#d9d9d9">IEEE MSS ALPHA’26 - BUILT TO BECOME</text>
  <text x="600" y="590" text-anchor="middle" font-family="Georgia, serif" font-size="40" letter-spacing="22" fill="#f2f2f2">COMING SOON</text>
</svg>`);

await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
  .composite([{ input: poster, left, top: Math.round((H - meta.height) / 2) }, { input: overlay, left: 0, top: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og.jpg');
console.log('public/og.jpg written');
