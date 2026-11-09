import type { BufferGeometry, Material } from 'three';
import { gsap, ScrollTrigger, isTouch } from '@/lib/motion/core';
import { ALPHA_PATH, ALPHA_VIEWBOX } from '@/assets/alpha/alpha-path';
import { poseAt, STATIONS, type Stop } from './stations';
import { POSTER, fitFov, parsePath, slatLayout } from './poster-fit';

/**
 * True when WebGL2 is available on real graphics hardware. Software rasterisers (SwiftShader,
 * llvmpipe — CPU-only machines, VMs, headless browsers) would starve the main thread, so those
 * visitors keep the static poster / α. `?gl=1` forces WebGL for debugging and tests.
 */
function hardwareWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    if (new URLSearchParams(location.search).get('gl') === '1') return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

const CROWD_VERT = /* glsl */ `
uniform float uTime; uniform float uPixelRatio; uniform float uOpacity;
attribute float aRand; varying float vAlpha;
void main(){
  vec3 p = position;
  float r = length(p.xy);
  float a = atan(p.y, p.x) + uTime * (0.05 + 0.12 / (0.6 + r)) * (aRand > 0.5 ? 1.0 : 0.8);
  p.xy = vec2(cos(a), sin(a)) * r;
  p.z += sin(uTime * 0.6 + aRand * 6.2831) * 0.05;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = min((1.0 + 2.2 * aRand) * uPixelRatio * (6.0 / -mv.z), 3.5 * uPixelRatio);
  gl_Position = projectionMatrix * mv;
  vAlpha = uOpacity * (0.25 + 0.75 * aRand) * smoothstep(1.35, 0.2, r);
}`;
const CROWD_FRAG = /* glsl */ `
varying float vAlpha;
void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.9), smoothstep(0.5, 0.1, d) * vAlpha); }`;

const ALPHA_H = 3.1;     // world height of the α
/** Let the browser breathe between heavy build steps (keeps every task short). */
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0));
const HERO_DIST = STATIONS.hero.cam[2];
/** the tour's normal lens is fitted as if the camera were here (stations were authored for it) */
const TOUR_DIST = 7.2;
/** the α's front face (half the extrusion depth + bevel) — the plane the poster α lives on */
const FRONT = (75 + 30) * (ALPHA_H / 1000);

export default async function stage(root: HTMLElement): Promise<() => void> {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-stage-canvas]')!;
  if (!hardwareWebGL2()) return () => {};

  const THREE = await import('three');
  await yieldToMain();
  const small = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 9, 24);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);

  // ---- Studio for the chrome: black room, a big soft key top-left, thin rim strips ----
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x000000);
  const panel = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  panel(5, 2, [-3.5, 3.5, 4], [-0.6, -0.6, 0], 3.8);      // key: top-left, front
  panel(0.35, 9, [-5, 0, 1.5], [0, Math.PI / 2.4, 0], 5); // left rim strip
  panel(0.25, 9, [5, 0.5, 1], [0, -Math.PI / 2.4, 0], 3); // right rim strip
  panel(9, 0.3, [0, 5, -1], [Math.PI / 2.2, 0, 0], 2);    // overhead line
  panel(7, 0.25, [0, -4, 3], [-Math.PI / 3, 0, 0], 0.45); // floor bounce
  panel(1.2, 6, [2, 0, 6], [0, 0, 0], 0.9);               // soft front fill
  panel(10, 3, [0, 3.5, 9], [0.4, Math.PI, 0], 0.32);       // upper front wash → graded silver faces
  panel(0.35, 7, [-1.6, 0, 7.5], [0, Math.PI, 0], 2.2);     // vertical highlight down the bowl's left side
  panel(0.25, 7, [1.9, 0, 7.5], [0, Math.PI, 0], 1.2);      // thinner one on the stroke
  panel(0.7, 12, [-3, 0, 9], [0, Math.PI, 0.55], 3.2);      // diagonal sweeps → the poster's streaked faces
  panel(0.35, 12, [3.2, 0, 9], [0, Math.PI, -0.45], 2);
  // soft side and back boxes so the chrome stays luminous when the tour turns it
  panel(5, 7, [-8, 0, 0], [0, Math.PI / 2, 0], 0.7);
  panel(5, 7, [8, 0, -1], [0, -Math.PI / 2, 0], 0.55);
  panel(8, 4, [0, 1, -9], [0, 0, 0], 0.45);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  scene.environment = envTex;
  await yieldToMain();

  // ---- α geometry from the GFS Didot outline ----
  const sp = new THREE.ShapePath();
  let cx = 0, cy = 0;
  for (const { c, v } of parsePath(ALPHA_PATH)) {
    if (c === 'M') { sp.moveTo(v[0], v[1]); [cx, cy] = [v[0], v[1]]; }
    else if (c === 'L') { for (let i = 0; i < v.length; i += 2) { sp.lineTo(v[i], v[i + 1]); [cx, cy] = [v[i], v[i + 1]]; } }
    else if (c === 'H') { for (const x of v) { sp.lineTo(x, cy); cx = x; } }
    else if (c === 'V') { for (const y of v) { sp.lineTo(cx, y); cy = y; } }
    else if (c === 'Q') { for (let i = 0; i < v.length; i += 4) { sp.quadraticCurveTo(v[i], v[i + 1], v[i + 2], v[i + 3]); [cx, cy] = [v[i + 2], v[i + 3]]; } }
    else if (c === 'C') { for (let i = 0; i < v.length; i += 6) { sp.bezierCurveTo(v[i], v[i + 1], v[i + 2], v[i + 3], v[i + 4], v[i + 5]); [cx, cy] = [v[i + 4], v[i + 5]]; } }
  }
  const geo = new THREE.ExtrudeGeometry(sp.toShapes(), {
    depth: 150, bevelEnabled: true, bevelThickness: 30, bevelSize: 16, bevelSegments: small ? 3 : 5, curveSegments: small ? 10 : 18,
  });
  const s = ALPHA_H / ALPHA_VIEWBOX.h;
  geo.translate(-ALPHA_VIEWBOX.w / 2, -ALPHA_VIEWBOX.h / 2, -75);
  geo.scale(s, -s, s);
  geo.computeVertexNormals();

  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xeaeaea, metalness: 1, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06,
    envMapIntensity: 1.5, side: THREE.DoubleSide, transparent: false,
  });
  // Pillow the flat faces: tilt front/back normals outward from the glyph's centre so reflections
  // sweep across them — the rounded, tubular chrome of the poster instead of flat grey plates.
  chromeMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
      float faceZ = step(0.6, abs(objectNormal.z));
      objectNormal = normalize(objectNormal + faceZ * vec3(position.x * 0.22, position.y * 0.2, 0.0) + faceZ * vec3(sin(position.y * 3.1) * 0.08, 0.0, 0.0));`,
    );
  };
  const alphaMesh = new THREE.Mesh(geo, chromeMat);
  const edges = new THREE.EdgesGeometry(geo, 24);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const alphaWire = new THREE.LineSegments(edges, wireMat);
  await yieldToMain();
  const alpha = new THREE.Group();
  alpha.add(alphaMesh, alphaWire);
  scene.add(alpha);

  // poster measurements → world units
  const posterH = ALPHA_H / POSTER.alphaH;
  const posterW = posterH * POSTER.aspect;
  const atDepth = (z: number) => (HERO_DIST - z) / (HERO_DIST - FRONT); // keep on-screen size equal to the poster's at z

  // ---- six glass slats, exactly where the poster has them ----
  const slats = new THREE.Group();
  const slatZ = 0.75;
  const k = atDepth(slatZ);
  const slatGlass = small
    ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.55, ior: 1.3, specularIntensity: 0.6, transparent: true, side: THREE.DoubleSide, envMapIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const slatLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
  const slatGeos: BufferGeometry[] = [];
  const glassMeshes: import('three').Mesh[] = [];
  let glassVisible = true;
  for (const L of slatLayout(ALPHA_H)) {
    const g = new THREE.PlaneGeometry(L.w * k, L.h * k); // planes: no side walls to go dark at an angle
    const e = new THREE.EdgesGeometry(g);
    slatGeos.push(g, e);
    const group = new THREE.Group();
    const outline = new THREE.LineSegments(e, slatLineMat);
    outline.position.z = 0.004; // nudge the outline off the glass (no z-fighting)
    const pane = new THREE.Mesh(g, slatGlass);
    glassMeshes.push(pane);
    group.add(pane, outline);
    group.position.set(L.x * k, L.y * k, slatZ);
    group.rotation.set(0, -0.16, 0.03); // turned, so each panel refracts — the poster's sliced α
    slats.add(group);
  }
  alpha.add(slats);

  // ---- crosshair ticks from the poster ----
  const tickMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const tickPts: number[] = [];
  const tz = 0.8;
  const tk = atDepth(tz);
  for (const [fx, fy] of [[0.14, 0.46], [0.78, 0.17], [0.6, 0.82]]) {
    const x = (fx - POSTER.alphaCx) * posterW * tk;
    const y = -(fy - POSTER.alphaCy) * posterH * tk;
    const d = 0.06;
    tickPts.push(x - d, y, tz, x + d, y, tz, x, y - d, tz, x, y + d, tz);
  }
  const tickGeo = new THREE.BufferGeometry();
  tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPts, 3));
  const ticks = new THREE.LineSegments(tickGeo, tickMat);
  alpha.add(ticks);

  const bowlX = (0.42 - POSTER.alphaCx) * posterW;

  // ---- swirling points in the bowl (the crowd, abstracted, for the tour) ----
  const N = small ? 2600 : 6500;
  const pos = new Float32Array(N * 3);
  const rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(Math.random()) * 1.25;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r * 0.82;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    rnd[i] = Math.random();
  }
  const crowdGeo = new THREE.BufferGeometry();
  crowdGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  crowdGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const crowdU = { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() }, uOpacity: { value: 0 } };
  const crowdMat = new THREE.ShaderMaterial({ uniforms: crowdU, vertexShader: CROWD_VERT, fragmentShader: CROWD_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const crowd = new THREE.Points(crowdGeo, crowdMat);
  crowd.position.set(bowlX, 0.02, -0.25);
  alpha.add(crowd);

  // ---- floor grid ----
  const grid = new THREE.GridHelper(40, 60, 0xffffff, 0xffffff);
  const gridMat = grid.material as Material;
  gridMat.transparent = true;
  gridMat.opacity = 0;
  gridMat.depthWrite = false;
  grid.position.y = -2.1;
  scene.add(grid);

  // ---- post: a soft bloom on the chrome highlights (desktop) ----
  let composer: { render(): void; setSize(w: number, h: number): void; setPixelRatio(r: number): void; dispose(): void } | null = null;
  if (!small) {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
    ]);
    const c = new EffectComposer(renderer);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.2, 0.4, 0.92));
    c.addPass(new OutputPass());
    composer = c;
  }

  // compile every shader off the critical path (parallel compile where supported) before the first frame
  await yieldToMain();
  await renderer.compileAsync(scene, camera);
  await yieldToMain();

  // ---- stations ----
  let stops: Stop[] = [];
  const measure = () => {
    const vh = window.innerHeight;
    stops = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const anchor = el.dataset.stationAt === 'top' ? top : top + Math.min(r.height, vh) / 2 - vh / 2;
        return { name: el.dataset.station!, at: Math.max(0, anchor) };
      })
      .sort((a, b) => a.at - b.at);
  };
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  let fovHero = 30;
  let fovTour = 38;
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(w, h);
    camera.aspect = w / h;
    // two lenses: a long one that reproduces the poster from the hero position, and the tour's normal
    // one; the loop blends between them by the lens weight (a dolly-zoom as the camera moves in)
    fovHero = fitFov(w, h, ALPHA_H, HERO_DIST - FRONT);
    fovTour = fitFov(w, h, ALPHA_H, TOUR_DIST - FRONT);
    camera.fov = fovHero;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---- pointer parallax ----
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!isTouch()) window.addEventListener('pointermove', onMove, { passive: true });

  // ---- loop ----
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const goal = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let first = true;
  let hidden = document.hidden;
  const onVis = () => { hidden = document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  const tick = (t: number, dt: number) => {
    if (hidden) return;
    const p = poseAt(stops, window.scrollY);
    // Portrait screens: the tour poses were composed for wide frames. Pull the camera back from the
    // α, keep the α nearer the centre and dim it behind body copy — everywhere except the exact
    // poster frame (weighted by 1 − lens so the hero fit is untouched).
    if (camera.aspect < 0.9) {
      const k = 1 - p.lens;
      const pull = 1 + 0.8 * k;
      const ax = p.alphaPos[0] * (1 - 0.7 * k);
      p.alphaPos = [ax, p.alphaPos[1], p.alphaPos[2]];
      p.cam = [ax + (p.cam[0] - ax) * pull, p.cam[1] * (1 + 0.3 * k), p.cam[2] * pull];
      p.target = [p.target[0] * (1 - 0.6 * k), p.target[1], p.target[2]];
      p.chrome *= 1 - 0.45 * k;
    }
    const lerp = first ? 1 : 0.085;
    first = false;
    camPos.lerp(goal.set(...p.cam), lerp);
    camTarget.lerp(tmp.set(...p.target), lerp);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    // less sway in the poster view so it reads as the poster
    const sway = 0.06 + 0.2 * (1 - p.lens);
    camera.position.set(camPos.x + pointer.x * sway, camPos.y - pointer.y * sway * 0.6, camPos.z);
    camera.lookAt(camTarget);
    const fov = fovTour + (fovHero - fovTour) * p.lens;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }

    alpha.position.lerp(tmp.set(...p.alphaPos), lerp);
    alpha.rotation.y += (p.alphaRotY + pointer.x * 0.03 - alpha.rotation.y) * lerp;

    // the chrome stays opaque (so it occludes the wireframe and the glass can always refract it);
    // "fading" it dims its colour and reflections instead — a dark α under bright lines in blueprint views
    const ch = p.stage * p.chrome;
    chromeMat.color.setScalar(0.92 * (0.08 + 0.92 * ch));
    chromeMat.envMapIntensity = 1.5 * (0.15 + 0.85 * ch);
    chromeMat.clearcoat = ch;
    wireMat.opacity = p.stage * 0.72 * p.wire;
    alphaWire.visible = wireMat.opacity > 0.01;
    slatLineMat.opacity = p.stage * 0.45 * p.slats;
    if (small) {
      slatGlass.opacity = p.stage * 0.05 * p.slats;
    } else {
      // wind the refraction down physically (thickness → 0, ior → 1) so the glass becomes optically
      // invisible, then drop it — opacity alone doesn't fade a transmissive material
      const glass = slatGlass as import('three').MeshPhysicalMaterial;
      const w = Math.min(1, p.slats);
      glass.thickness = 0.55 * w;
      glass.ior = 1 + 0.3 * w;
      glass.specularIntensity = 0.6 * w;
      glassVisible = w > 0.06;
    }
    slats.visible = p.slats > 0.02;
    for (const m of glassMeshes) m.visible = small || glassVisible;
    tickMat.opacity = 0.55 * p.lens;
    crowdU.uOpacity.value = p.stage * p.crowd;
    crowd.visible = p.crowd > 0.01;
    gridMat.opacity = p.stage * 0.06 * (1 - p.lens);

    const sec = dt / 1000;
    crowdU.uTime.value += sec;
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  root.classList.add('is-webgl');
  // tell the hero once real frames are on screen, so it can hand the poster over to the live scene
  requestAnimationFrame(() => requestAnimationFrame(() => {
    canvas.classList.add('is-on');
    root.dataset.stageReady = '';
    window.dispatchEvent(new CustomEvent('alpha:stage-live'));
  }));

  return () => {
    gsap.ticker.remove(tick);
    ScrollTrigger.removeEventListener('refresh', measure);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    [geo, edges, tickGeo, crowdGeo, grid.geometry as BufferGeometry, ...slatGeos].forEach((g) => g.dispose());
    [chromeMat, wireMat, slatGlass, slatLineMat, tickMat, crowdMat, gridMat].forEach((m) => m.dispose());
    composer?.dispose();
    envTex.dispose();
    renderer.dispose();
  };
}
