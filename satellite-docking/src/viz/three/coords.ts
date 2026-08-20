// Render-unit scale: 1 render unit = 100m. The default trailing preset (1km behind) plus a
// bit of headroom lands comfortably in a sane R3F scene scale -- chosen independently from
// cw-dynamics' 1 render unit = 1km (that demo's presets run km-scale; this one's run
// hundreds-of-meters-scale).
const RENDER_UNITS_PER_METER = 1 / 100;

export function toRenderScale(meters: number): number {
  return meters * RENDER_UNITS_PER_METER;
}

// Maps physical (x=radial, y=along-track, z=cross-track) to three.js (X, Y, Z) by putting
// cross-track on the render-vertical axis, same convention as cw-dynamics/src/viz/three/coords.ts:
// the orbital (radial/along-track) plane becomes the horizontal ground plane, and out-of-plane
// motion reads as intuitive up/down bobbing.
export function toRenderPosition(x: number, y: number, z: number): [number, number, number] {
  return [toRenderScale(x), toRenderScale(z), toRenderScale(y)];
}
