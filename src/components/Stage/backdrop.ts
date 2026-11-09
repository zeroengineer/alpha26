/**
 * The poster's crowd backdrop: the Figma raster with the α removed (scripts/make-backdrop.mjs),
 * gently swirled round the bowl so the crowd breathes, feathered into black at the sides.
 */
export const BACKDROP_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const BACKDROP_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uMap; uniform float uTime; uniform float uOpacity; uniform vec2 uBowl; uniform float uAspect;
void main(){
  // slow swirl about the bowl, strongest near it, fading out — the crowd circling the stage
  vec2 d = (vUv - uBowl) * vec2(uAspect, 1.0);
  float r = length(d);
  float ang = sin(uTime * 0.25) * 0.012 * smoothstep(0.55, 0.0, r) + uTime * 0.004 * smoothstep(0.4, 0.0, r);
  float c = cos(ang), s = sin(ang);
  vec2 rd = mat2(c, -s, s, c) * d;
  vec2 uv = uBowl + rd / vec2(uAspect, 1.0);
  float v = texture2D(uMap, uv).r;
  // feather the poster's edges into the black stage (as the hero raster does)
  float fx = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
  float fy = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
  v *= fx * fy * uOpacity;
  // the raster is sRGB; output linear for the renderer
  gl_FragColor = vec4(vec3(pow(v, 2.2)), 1.0);
}`;
