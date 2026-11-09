import type { Material, BufferGeometry } from 'three';
import { gsap } from '@/lib/motion/core';
import { sceneBus } from '@/lib/scene-bus';

/** Camera keyframes per scene (section id). Orano-style dolly between them. */
const KEYFRAMES: Record<string, { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
  hero: { pos: [0, 1.4, 9.5], target: [0, -1.2, 0], fov: 46 },
  about: { pos: [3.2, 2.4, 7.5], target: [0.8, -1.4, -1.5], fov: 44 },
  speakers: { pos: [-3.4, 1.8, 7.8], target: [-0.6, -1.3, -1], fov: 44 },
  venue: { pos: [0.4, 4.6, 6.2], target: [0, -1.6, -1.5], fov: 48 },
  partners: { pos: [4.2, 1.2, 6.4], target: [0.5, -1.4, -0.5], fov: 42 },
  organisers: { pos: [-2.4, 2.8, 6.8], target: [0, -1.5, -1.2], fov: 44 },
  contact: { pos: [0, 0.9, 10.5], target: [0, -1.1, 0], fov: 50 },
};
const FLOOR_Y = -2.2;

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m=m*m; m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0; vec3 h=abs(x)-0.5; vec3 ox=floor(x+0.5); vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}`;

const VERT = /* glsl */ `
${NOISE}
uniform float uTime; uniform vec3 uPointer; uniform float uReveal; uniform float uPixelRatio;
attribute float aRand; varying float vAlpha;
void main(){
  vec3 p = position;
  float h = snoise(p.xz * 0.32 + uTime * 0.07) * 0.75 + snoise(p.xz * 1.15 - uTime * 0.045) * 0.22;
  p.y += h;
  vec4 world = modelMatrix * vec4(p, 1.0);
  float d = distance(world.xz, uPointer.xz);
  float boost = smoothstep(4.2, 0.0, d);
  float ring = uReveal * 26.0;
  float reveal = 1.0 - smoothstep(ring - 5.0, ring, length(p.xz));
  vAlpha = (0.16 + 0.84 * boost) * reveal * (0.45 + 0.55 * aRand) * (0.55 + 0.45 * smoothstep(-0.9, 0.9, h));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (1.3 + 2.6 * boost + 0.9 * aRand) * uPixelRatio * (9.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
varying float vAlpha;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, r);
  gl_FragColor = vec4(vec3(0.88), a * vAlpha);
}`;

function supportsWebGL2(): boolean {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export default async function background(root: HTMLElement): Promise<() => void> {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-bg-canvas]')!;
  if (!supportsWebGL2()) return () => {};

  const THREE = await import('three');
  const small = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  const kf0 = KEYFRAMES.hero;
  camera.position.set(...kf0.pos);

  // ---- Particle field ----
  const seg = small ? [90, 52] : [168, 96];
  const geo = new THREE.PlaneGeometry(30, 18, seg[0], seg[1]);
  geo.rotateX(-Math.PI / 2);
  const count = geo.attributes.position.count;
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) rand[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, FLOOR_Y, 0) },
    uReveal: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.position.y = FLOOR_Y;
  scene.add(points);

  // ---- Faint grid on the same floor ----
  const grid = new THREE.GridHelper(40, 40, 0xffffff, 0xffffff);
  (grid.material as Material).transparent = true;
  (grid.material as Material).opacity = 0.05;
  (grid.material as Material).depthWrite = false;
  grid.position.y = FLOOR_Y - 0.9;
  scene.add(grid);

  // ---- Camera / pointer state ----
  const target = new THREE.Vector3(...kf0.target);
  const goal = { pos: new THREE.Vector3(...kf0.pos), target: new THREE.Vector3(...kf0.target), fov: kf0.fov };
  const parallax = { x: 0, y: 0 };
  const pointerNdc = new THREE.Vector2(0, 0);
  const pointerGoal = new THREE.Vector3(0, FLOOR_Y, 0);
  const raycaster = new THREE.Raycaster();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);

  const unsubscribe = sceneBus.on(({ id, progress }) => {
    const kf = KEYFRAMES[id] ?? KEYFRAMES.hero;
    goal.pos.set(...kf.pos);
    goal.target.set(...kf.target);
    goal.fov = kf.fov;
    // slight push-in as the visitor moves through a scene
    goal.pos.multiplyScalar(1 - progress * 0.08);
  });

  const onPointer = (e: PointerEvent) => {
    pointerNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floor, hit)) pointerGoal.copy(hit);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // ---- Loop ----
  let running = true;
  let hidden = document.hidden;
  const onVis = () => { hidden = document.hidden; };
  document.addEventListener('visibilitychange', onVis);

  const tick = (_t: number, delta: number) => {
    if (!running || hidden) return;
    uniforms.uTime.value += delta / 1000;
    uniforms.uPointer.value.lerp(pointerGoal, 0.06);
    parallax.x += (pointerNdc.x * 0.35 - parallax.x) * 0.04;
    parallax.y += (pointerNdc.y * 0.2 - parallax.y) * 0.04;
    camera.position.lerp(goal.pos, 0.035);
    camera.position.x += parallax.x * 0.02;
    camera.position.y += parallax.y * 0.02;
    target.lerp(goal.target, 0.035);
    camera.lookAt(target);
    if (Math.abs(camera.fov - goal.fov) > 0.05) {
      camera.fov += (goal.fov - camera.fov) * 0.04;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  // Reveal: particles bloom outwards from the centre (Orano's focus-distance reveal)
  gsap.to(uniforms.uReveal, { value: 1, duration: 3.2, ease: 'power2.out', delay: 0.2 });
  root.classList.add('is-webgl');
  requestAnimationFrame(() => canvas.classList.add('is-on'));

  return () => {
    running = false;
    gsap.ticker.remove(tick);
    unsubscribe();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVis);
    geo.dispose();
    mat.dispose();
    (grid.geometry as BufferGeometry).dispose();
    (grid.material as Material).dispose();
    renderer.dispose();
  };
}
