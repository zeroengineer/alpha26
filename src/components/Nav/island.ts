import { gsap, ScrollTrigger, reducedMotion, onReady } from '@/lib/motion/core';
import { getLenis, scrollToTarget } from '@/lib/motion/lenis';

export default function nav(bar: HTMLElement): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const toggle = bar.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const menu = document.querySelector<HTMLElement>('[data-menu]')!;
  const menuLinks = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-link]'));
  const transit = menu.querySelector<HTMLElement>('[data-menu-transit]')!;
  const transitStroke = menu.querySelector<SVGPathElement>('[data-transit-stroke]')!;
  const transitLabel = menu.querySelector<HTMLElement>('[data-transit-label]')!;
  const transitNo = menu.querySelector<HTMLElement>('[data-transit-no]')!;
  const transitBar = menu.querySelector<HTMLElement>('[data-transit-bar]')!;
  const menuChrome = Array.from(menu.querySelectorAll<HTMLElement>('.menu__list, .menu__foot'));
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
    const line = window.innerHeight * 0.5; // a section is active once its top passes mid-screen
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
      history.replaceState(null, '', id === 'hero' ? location.pathname : `#${id}`);
      if (menuOpen && link.hasAttribute('data-menu-link') && !reducedMotion()) {
        travel(link, target, id);
        return;
      }
      if (menuOpen) closeMenu();
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
      tl.fromTo(menuLinks, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' }, '-=0.3');
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
  // --- Mobile: tapping a menu link plays a short loading transit into the section ---
  //   the menu items slide away, an α outline draws with the destination's name, the page jumps
  //   to the section behind the overlay, then the overlay wipes up to reveal it.
  let travelling = false;
  const travel = (link: HTMLElement, target: HTMLElement, id: string) => {
    if (travelling) return;
    travelling = true;
    transitLabel.textContent = link.querySelector('.menu__label')?.textContent ?? '';
    transitNo.textContent = link.querySelector('.menu__no')?.textContent ?? '';
    const chosen = link;
    const others = menuLinks.filter((l) => l !== chosen);
    gsap.timeline({
      onComplete: () => {
        travelling = false;
        menuOpen = false;
        gsap.set(transit, { autoAlpha: 0 });
        gsap.set([menuChrome, menuLinks], { clearProps: 'all' });
        gsap.set(transitStroke, { strokeDashoffset: 1 });
        gsap.set(transitBar, { scaleX: 0 });
        menu.hidden = true;
        menu.style.clipPath = 'inset(0 0 100% 0)';
        getLenis()?.start();
        toggle.setAttribute('aria-expanded', 'false');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    })
      // 1) the other items fall away, the chosen one lifts and fades
      .to(others, { y: 24, opacity: 0, duration: 0.35, stagger: 0.04, ease: 'power2.in' })
      .to(chosen, { x: 16, opacity: 0, duration: 0.4, ease: 'power2.in' }, '-=0.15')
      .to(menuChrome.filter((c) => c.classList.contains('menu__foot')), { opacity: 0, duration: 0.3 }, '<')
      // 2) the α draws itself with the destination's name, a thin bar fills
      .set(transit, { autoAlpha: 1 })
      .fromTo(transit.querySelector('.menu__transit-label'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
      .to(transitStroke, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '<')
      .to(transitBar, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '<')
      // 3) behind the overlay, jump to the section (no long scroll through everything in between)
      .call(() => {
        document.documentElement.style.overflow = '';
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const y = id === 'hero' ? 0 : target.getBoundingClientRect().top + window.scrollY - margin;
        window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
        getLenis()?.scrollTo(y, { immediate: true, force: true });
        ScrollTrigger.update();
      })
      // 4) the overlay wipes up, revealing the section
      .to(transit, { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' }, '+=0.1')
      .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: 'power4.inOut' }, '-=0.1');
  };

  toggle.addEventListener('click', () => { if (!travelling) (menuOpen ? closeMenu() : openMenu()); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches && menuOpen) closeMenu();
  });

  // Deep link on load (#about etc.) — jump after the preloader and a layout pass so the pin maths are stable.
  if (location.hash) {
    const target = document.querySelector<HTMLElement>(location.hash);
    if (target) {
      onReady(() => {
        ScrollTrigger.refresh();
        requestAnimationFrame(() => scrollToTarget(target));
      });
    }
  }
}
