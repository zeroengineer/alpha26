/**
 * Only the parts of three.js the α stage uses, re-exported by name so the bundler can tree-shake the
 * rest. The stage loads this module lazily (`await import('./three-lite')`) — add a class here when
 * island.ts starts using it.
 */
export {
  ACESFilmicToneMapping, AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide,
  EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute, Fog, GridHelper, Group, LineBasicMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PMREMGenerator, PerspectiveCamera,
  PlaneGeometry, Points, SRGBColorSpace, Scene, ShaderMaterial, ShapePath, Vector2, Vector3,
  WebGLRenderer,
} from 'three';
