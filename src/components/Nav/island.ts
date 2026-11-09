import { gsap, ScrollTrigger, reducedMotion } from '@/lib/motion/core';
import { getLenis, scrollToTarget } from '@/lib/motion/lenis';

export default function nav(bar: HTMLElement): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const toggle = bar.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const menu = document.querySelector<HTMLElement>('[data-menu]')!;
  const menuLinks = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-link]'));
  const navH = () => bar.offsetHeight;

  // Sections in document order (deduped from the link list) for active tracking.
  const sections = links
    .map((l) => l.dataset.navLink!)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);

  // --- Active section: the last section whose top has crossed the nav line ---
  let current = '';
  const setActive = (id: string) => {
    if (id === current) return;
    current = id;
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.navLink === id));
  };
  const resolveActive = () => {
    const line = navH() + 2;
    let active = sections[0]?.id ?? '';
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) active = s.id;
    }
    // At the very bottom the last section wins even if it is shorter than the viewport.
    if (Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) {
      active = sections[sections.length - 1]?.id ?? active;
    }
    setActive(active);
  };

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      bar.classList.toggle('is-scrolled', self.scroll() > 24);
      resolveActive();
    },
  });
  ScrollTrigger.addEventListener('refresh', resolveActive);
  resolveActive();

  // --- Anchor scrolling through Lenis (or native). Sections carry scroll-margin-top = nav height. ---
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.dataset.navLink!;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) closeMenu();
      history.replaceState(null, '', id === 'hero' ? location.pathname : `#${id}`);
      scrollToTarget(target);
    });
  });

  // --- Mobile overlay menu ---
  let menuOpen = false;
  const openMenu = () => {
    menuOpen = true;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    getLenis()?.stop();
    document.documentElement.style.overflow = 'hidden';
    const tl = gsap.timeline();
    tl.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: reducedMotion() ? 0 : 0.7, ease: 'power4.inOut' });
    if (!reducedMotion()) {
      tl.from(menuLinks, { y: 30, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'power3.out' }, '-=0.3');
    }
    menuLinks[0]?.focus();
  };
  const closeMenu = () => {
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    gsap.to(menu, {
      clipPath: 'inset(0 0 100% 0)',
      duration: reducedMotion() ? 0 : 0.5,
      ease: 'power4.inOut',
      onComplete: () => {
        menu.hidden = true;
        getLenis()?.start();
        document.documentElement.style.overflow = '';
      },
    });
    toggle.focus();
  };
  toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches && menuOpen) closeMenu();
  });

  // Deep link on load (#about etc.) — jump after the preloader so the pin maths are stable.
  if (location.hash) {
    const target = document.querySelector<HTMLElement>(location.hash);
    if (target) {
      window.addEventListener('alpha:reveal', () => scrollToTarget(target), { once: true });
    }
  }
}
