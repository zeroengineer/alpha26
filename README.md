# ALPHA '26 — Built to Become

Single-page event website for **ALPHA '26**, the two-day residential industry-readiness programme by the
Industry Relations Committee of IEEE Malabar Subsection.

## Stack
- [Astro 5](https://astro.build) — static output, zero JS by default
- Vanilla-TS **islands** (`src/lib/island.ts`) — each section's behaviour is lazy-loaded when it nears the viewport
- [GSAP 3](https://gsap.com) (ScrollTrigger, SplitText, ScrambleText, Observer) + [Lenis](https://lenis.darkroom.engineering) for motion
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

## Project layout
```
src/
  components/<Section>/   Section.astro (+ island.ts for behaviour)
  content/site.ts         event copy, links and LAUNCH FLAGS
  content/organisers.ts   "The Team" + "The Venue" copy
  content/data/*.json     speakers, sessions, sponsors, collaborators, gallery (photos + event details)
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

## Performance
Lighthouse (mobile, production build, 2026-11-09): Performance 94 · Accessibility 100 · Best Practices 100 ·
SEO 100 — LCP 2.4 s, TBT 20 ms, CLS 0. Speed Index is held back only by the intentional preloader.
Techniques: zero-JS-by-default Astro, lazy vanilla-TS islands, dynamic-imported GSAP plugins, AVIF/WebP via
`astro:assets`, subset woff2 fonts with preload, and full reduced-motion paths.

## Design system
Taken from the Figma poster (`Gs5L3nGORbec6ayQffbFqB`): black ground, `#fefefe` ink, `#989898` dim, metallic
text gradient `linear-gradient(180deg, #fefefe 1%, #989898 136%)`, blurred black vignettes, **Sora** for UI/body
(wide-tracked uppercase captions) and **Switella** for display lines. All values live in `src/styles/tokens.css`.

## Fonts & licences
- Sora — SIL OFL 1.1.
- Switella DEMO — personal-use demo licence; used as-is on the organisers' decision. Obtain the full licence
  from https://typeclassheroes.com before commercial use.
- Placeholder photos — Pexels, see `CREDITS.md`.
