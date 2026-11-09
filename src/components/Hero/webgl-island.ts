import { gsap, reducedMotion } from '@/lib/motion/core';
import { heroEntrance, heroScrub, pointerTracker } from './hero-shared';

const SLAT_CENTERS = [0.19, 0.32, 0.45, 0.58, 0.71, 0.84]; // fraction of poster width, from the Figma frame
const POSTER_RATIO = 0.75; // 1080 × 1440

function supportsWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export default async function heroWebgl(section: HTMLElement): Promise<() => void> {
  const scene = section.querySelector<HTMLElement>('[data-scene]')!;
  const canvas = section.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const fallback = section.querySelector<HTMLElement>('[data-fallback]')!;

  // ----- Fallback path: static poster, same entrance/scrub as the copy -----
  if (!supportsWebGL2() || reducedMotion()) {
    canvas.remove();
    fallback.hidden = false;
    heroEntrance(section, (tl) => tl.to(scene, { opacity: 1, duration: 1.4 }, 0));
    heroScrub(section, (p) => gsap.set(scene, { filter: `brightness(${1 - p * 0.75})` }));
    return () => {};
  }

  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

  // ----- Renderer / camera -----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 1);

  const world = new THREE.Scene();
  const CAM_Z = 3.2;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, CAM_Z);

  const pmrem = new THREE.PMREMGenerator(renderer);
  world.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // ----- Poster plane -----
  const texture = await new THREE.TextureLoader().loadAsync(section.dataset.texture!);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const posterMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  const posterGeo = new THREE.PlaneGeometry(1, 1);
  const poster = new THREE.Mesh(posterGeo, posterMat);
  world.add(poster);

  // ----- Glass slats -----
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 0.05,
    roughness: 0.06,
    ior: 1.25,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
    specularIntensity: 1,
  });
  const slatGroup = new THREE.Group();
  const slatGeo = new THREE.BoxGeometry(1, 1, 0.035);
  const slats = SLAT_CENTERS.map(() => {
    const m = new THREE.Mesh(slatGeo, glass);
    m.rotation.z = 0.035;
    m.rotation.y = -0.12;
    slatGroup.add(m);
    return m;
  });
  world.add(slatGroup);

  // ----- Lights: a key light for clearcoat glints + a sweeping light moving across the slats -----
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-2, 3, 4);
  world.add(key);
  const sweep = new THREE.PointLight(0xffffff, 6, 4, 1.6);
  sweep.position.set(-2.5, 0.6, 1.2);
  world.add(sweep);

  // ----- Sizing: poster covers 115% of viewport height (or the full width on portrait) -----
  let posterH = 1;
  let posterW = 1;
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = scene;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const visibleH = 2 * CAM_Z * Math.tan((camera.fov * Math.PI) / 360);
    const visibleW = visibleH * camera.aspect;
    // Landscape: 115% of the viewport height; portrait: cover the width (mirrors the CSS variants).
    const portrait = w < h;
    posterH = portrait ? Math.max(visibleH, visibleW / POSTER_RATIO) : visibleH * 1.15;
    posterW = posterH * POSTER_RATIO;
    poster.scale.set(posterW, posterH, 1);

    slats.forEach((s, i) => {
      s.scale.set(posterW * 0.11, posterH * 0.83, 1);
      s.position.set(posterW * (SLAT_CENTERS[i] - 0.5), 0, 0.22);
    });
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(scene);

  // ----- Motion -----
  const pointer = pointerTracker(section);
  const state = { progress: 0, sweepX: -2.5 };
  gsap.to(state, { sweepX: 2.5, duration: 3.2, ease: 'power2.inOut', repeat: -1, repeatDelay: 4.5, delay: 1.5 });

  let running = true;
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(section);

  const tick = () => {
    if (!running || !visible) return;
    camera.position.x = pointer.x * 0.14;
    camera.position.y = -pointer.y * 0.09;
    camera.position.z = CAM_Z - state.progress * 0.55;
    camera.lookAt(0, 0, 0);
    slatGroup.rotation.y = pointer.x * -0.06;
    sweep.position.x = state.sweepX;
    const b = 1 - state.progress * 0.75;
    posterMat.color.setScalar(b);
    renderer.render(world, camera);
  };
  gsap.ticker.add(tick);

  heroEntrance(section, (tl) => {
    tl.to(scene, { opacity: 1, duration: 1.6 }, 0)
      .fromTo(camera.position, { z: CAM_Z + 0.6 }, { z: CAM_Z, duration: 2.2, ease: 'power3.out' }, 0)
      .fromTo(slats.map((s) => s.scale), { y: 0 }, { y: posterH * 0.83, duration: 1.3, ease: 'power4.out', stagger: { each: 0.07, from: 'center' } }, 0.5);
  });
  heroScrub(section, (p) => { state.progress = p; });

  return () => {
    running = false;
    gsap.ticker.remove(tick);
    ro.disconnect();
    io.disconnect();
    pointer.dispose();
    posterGeo.dispose();
    slatGeo.dispose();
    posterMat.dispose();
    glass.dispose();
    texture.dispose();
    renderer.dispose();
  };
}
