// Chaser state relative to the chief, in the chief's LVLH (Hill) frame:
// x = radial (away from Earth), y = along-track (direction of motion), z = cross-track
// (orbit-normal). Positions in meters, velocities in meters/second. Same convention as
// ../../../cw-dynamics/src/core/types/orbit.ts.
export interface RelativeState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

// State order [x, y, z, vx, vy, vz], matching stateSpaceMatrix()/inputMatrix() and the course's
// clohessy_wiltshire_inputs.m -- the plain-array form the RK4/control math (Vector, number[][])
// operates on.
export function toVector(state: RelativeState): number[] {
  return [state.x, state.y, state.z, state.vx, state.vy, state.vz];
}

export function fromVector(v: number[]): RelativeState {
  return { x: v[0], y: v[1], z: v[2], vx: v[3], vy: v[4], vz: v[5] };
}
