// Circular chief orbit, parameterized by altitude above Earth's mean equatorial radius.
export interface ChiefOrbit {
  altitudeKm: number;
}

// Chaser state relative to the chief, in the chief's LVLH (Hill) frame:
// x = radial (away from Earth), y = along-track (direction of motion), z = cross-track
// (orbit-normal). Positions in meters, velocities in meters/second.
export interface RelativeState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}
