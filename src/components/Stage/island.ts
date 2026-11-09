import type { BufferGeometry, Material } from 'three';
import { gsap, ScrollTrigger, isTouch } from '@/lib/motion/core';
import { ALPHA_PATH, ALPHA_VIEWBOX } from '@/assets/alpha/alpha-path';
import { poseAt, type Stop } from './stations';

/**
 * True when WebGL2 is available on real graphics hardware. Software rasterisers (SwiftShader,
 * llvmpipe — CPU-only machines, VMs, headless browsers) would starve the main thread, so those
 * visitors keep the static α. `?gl=1` forces WebGL for debugging and tests.
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

export default async function stage(root: HTMLElement): Promise<() => void> {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-stage-canvas]')!;
  if (!hardwareWebGL2()) return () => {};

  const THREE = await import('three');
  const { SVGLoader } = await import('three/examples/jsm/loaders/SVGLoader.js');
  const small = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.6));
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 7, 20);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);

  // ---- Studio environment: black room + thin strip lights → chrome α like the poster ----
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x000000);
  const strip = (w: number, h: number, pos: [number, number, number], ry: number, k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.y = ry; env.add(m);
  };
  strip(0.5, 8, [-4, 1, 3], Math.PI / 3, 4);
  strip(0.3, 8, [4.5, 0, 2], -Math.PI / 3, 3);
  strip(8, 0.25, [0, 4.5, 0], 0, 2);
  strip(6, 0.2, [0, -3.5, 3], 0, 1.2);
  // soft front/top fill so the face of the α catches light in the front-on views (like the poster)
  strip(9, 0.9, [0, 3.2, 7], -0.35, 1.6);
  strip(0.6, 6, [-2.5, 0, 7], 0.2, 1.1);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();

  // ---- α geometry from the GFS Didot outline ----
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${ALPHA_PATH}"/></svg>`);
  const shapes = svg.paths.flatMap((p) => p.toShapes());
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 150, bevelEnabled: true, bevelThickness: 26, bevelSize: 14, bevelSegments: small ? 3 : 6, curveSegments: small ? 14 : 28,
  });
  const H = 3.1; // world height of the α
  const s = H / ALPHA_VIEWBOX.h;
  geo.translate(-ALPHA_VIEWBOX.w / 2, -ALPHA_VIEWBOX.h / 2, -75);
  geo.scale(s, -s, s); // SVG y-down → world y-up
  geo.computeVertexNormals();

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdedede, metalness: 1, roughness: 0.2, envMap: envTex, envMapIntensity: 1.25,
    side: THREE.DoubleSide, transparent: true,
  });
  const alphaMesh = new THREE.Mesh(geo, chromeMat);
  const edges = new THREE.EdgesGeometry(geo, 24);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
  const alphaWire = new THREE.LineSegments(edges, wireMat);
  const edgeCount = edges.attributes.position.count;
  edges.setDrawRange(0, 0);

  const alpha = new THREE.Group();
  alpha.add(alphaMesh, alphaWire);
  scene.add(alpha);

  // ---- six glass slats (poster) as wire planes with a faint fill ----
  const slats = new THREE.Group();
  const slatGeo = new THREE.PlaneGeometry(0.42, 3.5);
  const slatEdges = new THREE.EdgesGeometry(slatGeo);
  const slatLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  const slatFillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.025, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(slatGeo, slatFillMat), new THREE.LineSegments(slatEdges, slatLineMat));
    g.position.set(-1.45 + i * 0.58, 0.05, 0.55);
    g.rotation.set(0, -0.12, 0.035);
    slats.add(g);
  }
  alpha.add(slats);

  // ---- crowd: swirling points inside the bowl (the poster's overhead crowd) ----
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
  crowd.position.set(-0.36, 0.02, -0.25); // centre of the α's bowl
  alpha.add(crowd);

  // ---- floor grid (drawing-board feel) ----
  const grid = new THREE.GridHelper(40, 60, 0xffffff, 0xffffff);
  const gridMat = grid.material as Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.05;
  gridMat.depthWrite = false;
  grid.position.y = -2.1;
  scene.add(grid);

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

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the α the same apparent size on portrait screens
    camera.fov = w < h ? 52 : 38;
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
  const goalPos = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const look = new THREE.Vector3();
  let first = true;
  let hidden = document.hidden;
  const onVis = () => { hidden = document.hidden; };
  document.addEventListener('visibilitychange', onVis);
  const intro = { draw: 0, bloom: 0 };

  const tick = (_t: number, dt: number) => {
    if (hidden) return;
    const p = poseAt(stops, window.scrollY);
    goalPos.set(...p.cam);
    goalTarget.set(...p.target);
    const k = first ? 1 : 0.08;
    first = false;
    camPos.lerp(goalPos, k);
    camTarget.lerp(goalTarget, k);
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.set(camPos.x + pointer.x * 0.25, camPos.y - pointer.y * 0.15, camPos.z);
    look.copy(camTarget);
    camera.lookAt(look);

    alpha.position.lerp(look.set(...p.alphaPos), k);
    alpha.rotation.y += (p.alphaRotY + Math.sin(_t * 0.25) * 0.04 - alpha.rotation.y) * k;
    alpha.rotation.x = Math.sin(_t * 0.2) * 0.02;

    const st = p.stage;
    chromeMat.opacity = st * p.chrome * intro.bloom;
    chromeMat.visible = chromeMat.opacity > 0.01;
    wireMat.opacity = st * (0.12 + 0.6 * p.wire);
    slatLineMat.opacity = st * 0.35 * p.slats * intro.bloom;
    slatFillMat.opacity = st * 0.03 * p.slats * intro.bloom;
    crowdU.uOpacity.value = st * p.crowd * intro.bloom;
    gridMat.opacity = st * 0.06;
    crowdU.uTime.value += dt / 1000;
    edges.setDrawRange(0, Math.floor(edgeCount * intro.draw));

    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  // draw the α's edges on, then let the chrome and crowd bloom in (doyourdesign line draw)
  gsap.timeline({ delay: 0.2 })
    .to(intro, { draw: 1, duration: 2.6, ease: 'power2.inOut' })
    .to(intro, { bloom: 1, duration: 1.8, ease: 'power2.out' }, 1.4);
  root.classList.add('is-webgl');
  requestAnimationFrame(() => canvas.classList.add('is-on'));
  root.dataset.stageReady = '';

  return () => {
    gsap.ticker.remove(tick);
    ScrollTrigger.removeEventListener('refresh', measure);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVis);
    [geo, edges, slatGeo, slatEdges, crowdGeo, grid.geometry as BufferGeometry].forEach((g) => g.dispose());
    [chromeMat, wireMat, slatLineMat, slatFillMat, crowdMat, gridMat].forEach((m) => m.dispose());
    envTex.dispose();
    renderer.dispose();
  };
}
