import type { RelativeState } from '../../core/types/orbit';

// Render-unit scale: 1 render unit = 1 km. Chosen so the ~1-5 km relative-orbit amplitudes used
// by the sliders/presets land in a sane R3F scene scale.
const RENDER_UNITS_PER_METER = 1 / 1000;

// Maps physical (x=radial, y=along-track, z=cross-track) to three.js (X, Y, Z) by putting
// cross-track on the render-vertical axis: the orbital (radial/along-track) plane becomes the
// horizontal ground plane, and out-of-plane motion reads as intuitive up/down bobbing.
export function toRenderPosition(state: RelativeState): [number, number, number] {
  return [state.x * RENDER_UNITS_PER_METER, state.z * RENDER_UNITS_PER_METER, state.y * RENDER_UNITS_PER_METER];
}
