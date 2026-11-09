/**
 * Minimal "island" hydration for vanilla-TS behaviour.
 * Each section's behaviour lives in an `island.ts` next to its `.astro` file and is
 * dynamic-imported only when the element is near the viewport (or when the browser is idle),
 * so the page ships zero JS for sections the visitor never reaches.
 *
 * An element may host several islands (e.g. the generic Section reveal plus a section-specific
 * island), so mounts are tracked per selector. Once mounted, the selector is appended to the
 * element's `data-island-ready` attribute (space separated) — tests wait on
 * `[data-island-ready~="<selector>"]`.
 */
export type IslandModule<E extends Element = HTMLElement> = {
  default: (el: E) => void | (() => void) | Promise<void | (() => void)>;
};

type Strategy = 'visible' | 'idle' | 'load';

interface IslandOptions {
  strategy?: Strategy;
  /** rootMargin for the visible strategy — pre-load slightly before entering view. */
  rootMargin?: string;
}

type Hosted = Element & { __islands?: Set<string> };

export function defineIsland<E extends Element = HTMLElement>(
  selector: string,
  load: () => Promise<IslandModule<E>>,
  { strategy = 'visible', rootMargin = '25% 0px' }: IslandOptions = {},
): void {
  const targets = Array.from(document.querySelectorAll<E>(selector));
  if (targets.length === 0) return;

  const mount = async (el: E) => {
    const host = el as unknown as Hosted;
    host.__islands ??= new Set();
    if (host.__islands.has(selector)) return;
    host.__islands.add(selector);
    const mod = await load();
    await mod.default(el);
    const ready = (host.getAttribute('data-island-ready') ?? '').split(' ').filter(Boolean);
    host.setAttribute('data-island-ready', [...ready, selector].join(' '));
  };

  if (strategy === 'load') {
    targets.forEach(mount);
    return;
  }

  if (strategy === 'idle') {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    idle ? idle(() => targets.forEach(mount)) : setTimeout(() => targets.forEach(mount), 200);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        void mount(entry.target as E);
      }
    },
    { rootMargin },
  );
  targets.forEach((t) => io.observe(t));
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
