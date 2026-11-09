# ALPHA '26 — Built to Become

Single-page event website for **ALPHA '26**, the two-day residential industry-readiness programme by the
Industry Relations Committee of IEEE Malabar Subsection.

## Stack
- [Astro 5](https://astro.build) — static output, zero JS by default
- Vanilla-TS **islands** (`src/lib/island.ts`) — each section's behaviour is lazy-loaded when it nears the viewport
- [GSAP 3](https://gsap.com) (ScrollTrigger, SplitText) + [Lenis](https://lenis.darkroom.engineering) for motion
- [three.js](https://threejs.org) — the persistent α stage only (built on the visitor's first interaction)
- Vitest (unit) · Playwright (e2e) · Sharp via `astro:assets` (AVIF/WebP)
- Hosted on **Cloudflare Pages** — build `npm run build`, output `dist`

## Getting started
```sh
nvm use            # Node 22
npm install
npm run dev        # http://localhost:4321
npm test           # unit tests
npm run check      # astro check (types + templates)
npm run e2e        # Playwright (desktop + mobile) against a fresh production build
npm run build      # production build to dist/
```

## Experience
- **α stage** (`src/components/Stage/`): a fixed three.js scene behind the whole page that **opens as the poster**.
  At the hero station it reproduces the Figma composition exactly — the α (GFS Didot outline, extruded chrome with
  pillowed faces), the six refracting glass slats and the crosshair ticks at their measured poster positions
  (`poster-fit.ts`), over the poster's own crowd backdrop (`scripts/make-backdrop.mjs` removes the α from the raster).
  The raster poster is only the instant first paint; once the live scene is built (first interaction, or after 6 s)
  it dissolves into it in place, so scrolling is one continuous camera move on the same object: a dolly-zoom from the
  long "poster" lens into the tour, then stations (`stations.ts`, unit-tested) — turned aside for the programme, low
  blueprint view for the pillars, through the bowl for the statement, behind for the team, plan view under the photo
  collage, back to the poster frame for contact. Static poster / α outline for reduced motion, missing WebGL2 or
  software-only GPUs (`?gl=1` forces WebGL).
- **Hero**: caption, COMING SOON and handle placed as in the poster over the live scene; the copy lifts away on scroll.
- **Layout**: no tidy column — blocks hold different columns and corners, and every `data-speed` element drifts at
  its own speed (`src/lib/motion/parallax.ts`). Text focuses in out of a blur line by line and blurs away as it
  leaves (`src/lib/motion/reveal.ts`). A drawing-board scale ruler (bottom-right) tracks progress.

## Project layout
```
src/
  components/<Section>/   Section.astro (+ island.ts for behaviour)
  content/site.ts         event copy, links and LAUNCH FLAGS
  content/organisers.ts   "The Team" + "The Venue" copy
  content/data/*.json     speakers, sessions, sponsors, collaborators, past events, gallery
  content.config.ts       zod schemas for the JSON collections
  lib/                    island loader, nav builder, motion primitives
  styles/tokens.css       design tokens from the Figma poster
  styles/global.css       fonts, reset, utilities (.metal-text, .display, .section-no …)
  assets/                 brand logos, poster artwork, fonts, placeholder photos
public/fonts/             subset woff2 (regenerate with `npm run fonts:subset`)
```

## Launching hidden sections
The event is currently "coming soon". Speakers, venue, partners, dates and registration are fully built but
**not rendered** (neither the section nor its nav link appears in the HTML) while their flag is off.

1. Open `src/content/site.ts` and flip the flag(s) in `features` to `true`.
2. Fill in the real data under `src/content/data/` (schemas in `src/content.config.ts` will validate it at build).
3. Commit and push — Cloudflare Pages rebuilds.

To preview or test the hidden sections **without** editing the flags, force them on at build time:

```sh
ALPHA_FLAGS=all npm run dev        # or a comma list: ALPHA_FLAGS=speakers,host
npm run build:launched             # production build with every flag on
npm run e2e:launched               # Playwright suite for the launched layout
```

| Flag | Section | Data |
| --- | --- | --- |
| `speakers` | The Lineup (nav: Speakers) | `data/speakers.json`, `data/sessions.json` |
| `host` | The Venue (nav: Venue) | `content/organisers.ts` → `host` |
| `sponsors` | Powered Together (nav: Partners) | `data/sponsors.json` |
| `collaborators` | collaborators strip inside Partners | `data/collaborators.json` |
| `dates` | dates in hero + schedule | `site.dates` |
| `registration` | register CTA in hero + footer | `site.registrationUrl` |

## Deployment (Cloudflare Pages)
- Framework preset: **Astro** · build command `npm run build` · output directory `dist` · Node 22 (`.nvmrc`).
- `public/_headers` sets security headers and immutable caching for `/_astro/*` and `/fonts/*`.
- Update `site.url` in `src/content/site.ts` and `site` in `astro.config.mjs` once the final domain is known
  (canonical URL, Open Graph image, sitemap and JSON-LD all derive from it).
- `public/og.jpg` is generated from the poster with `node scripts/og-image.mjs`.
- If the Figma poster changes: re-export `src/assets/figma/alpha-crowd.png`, update the measurements in
  `src/components/Stage/poster-fit.ts` if the α or slats moved, and run `node scripts/make-backdrop.mjs`.

## Performance
Lighthouse (production build, 2026-11-09): mobile 97 · 100 · 100 · 100 (LCP 2.5 s, TBT 40 ms); desktop 100 · 100 · 100 · 100.
The live scene is built on first interaction in short, yielding steps with async shader compilation.
Techniques: zero-JS-by-default Astro, lazy vanilla-TS islands, dynamic-imported GSAP plugins, AVIF/WebP via
`astro:assets`, subset woff2 fonts with preload, and full reduced-motion paths.

## Design system
Taken from the Figma poster (`Gs5L3nGORbec6ayQffbFqB`): black ground, `#fefefe` ink, `#989898` dim, metallic
text gradient `linear-gradient(180deg, #fefefe 1%, #989898 136%)`, blurred black vignettes, **Sora** for UI/body
(wide-tracked uppercase captions) and **Switella** for display lines. All values live in `src/styles/tokens.css`.

## Fonts & licences
- Sora — SIL OFL 1.1.
- GFS Didot (α outline for the 3D stage) — SIL OFL 1.1 (`src/assets/alpha/OFL-GFSDidot.txt`).
- Switella DEMO — personal-use demo licence; used as-is on the organisers' decision. Obtain the full licence
  from https://typeclassheroes.com before commercial use.
- Placeholder photos — Pexels, see `CREDITS.md`.
