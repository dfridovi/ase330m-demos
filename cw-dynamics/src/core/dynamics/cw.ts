import { MU_EARTH, R_EARTH } from '../constants';
import type { RelativeState } from '../types/orbit';

// Mean motion n = sqrt(mu / a^3) of a circular chief orbit at the given altitude.
export function meanMotion(altitudeKm: number): number {
  const a = R_EARTH + altitudeKm * 1000;
  return Math.sqrt(MU_EARTH / (a * a * a));
}

export function orbitalPeriod(n: number): number {
  return (2 * Math.PI) / n;
}

// The linearized Clohessy-Wiltshire / Hill state matrix, state order
// [x, y, z, vx, vy, vz]. Shown to students as the reference matrix; the
// simulation below does not integrate it numerically (see propagate/decompose).
export function stateSpaceMatrix(n: number): number[][] {
  return [
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
    [3 * n * n, 0, 0, 0, 2 * n, 0],
    [0, 0, 0, -2 * n, 0, 0],
    [0, 0, -n * n, 0, 0, 0],
  ];
}

// Closed-form CW state transition: exact solution of
//   x'' - 2n y' - 3n^2 x = 0
//   y'' + 2n x'          = 0
//   z'' + n^2 z           = 0
// verified by direct substitution back into the ODEs above.
export function propagate(state0: RelativeState, n: number, t: number): RelativeState {
  const { x: x0, y: y0, z: z0, vx: vx0, vy: vy0, vz: vz0 } = state0;
  const c = Math.cos(n * t);
  const s = Math.sin(n * t);

  const x = (4 - 3 * c) * x0 + (s / n) * vx0 + (2 / n) * (1 - c) * vy0;
  const y = 6 * (s - n * t) * x0 + y0 - (2 / n) * (1 - c) * vx0 + (1 / n) * (4 * s - 3 * n * t) * vy0;
  const vx = 3 * n * s * x0 + c * vx0 + 2 * s * vy0;
  const vy = 6 * n * (c - 1) * x0 - 2 * s * vx0 + (4 * c - 3) * vy0;

  const z = z0 * c + (vz0 / n) * s;
  const vz = -z0 * n * s + vz0 * c;

  return { x, y, z, vx, vy, vz };
}

// The along-track secular drift rate (m/s): the non-oscillatory part of vy.
// The in-plane relative orbit is periodic (closes on itself every orbit) iff this is zero,
// i.e. iff vy0 = -2n x0.
export function secularDriftRate(state0: RelativeState, n: number): number {
  return -3 * (2 * n * state0.x + state0.vy);
}

// The along-track initial velocity that exactly cancels drift, given x0 and n.
export function noDriftVy0(x0: number, n: number): number {
  return -2 * n * x0;
}

// Exact decomposition of propagate() into three additive pieces that sum back to it:
//  - drift: the non-oscillatory part (constant offset in x, constant + secular-in-t in y).
//    This is the projection onto the defective (Jordan-block) zero-eigenvalue subspace of
//    the in-plane subsystem.
//  - inPlane: the bounded oscillatory part of x/y, at frequency n (the classic 2:1 ellipse).
//  - crossTrack: the fully decoupled out-of-plane oscillation, also at frequency n.
export function decompose(
  state0: RelativeState,
  n: number,
  t: number,
): { drift: RelativeState; inPlane: RelativeState; crossTrack: RelativeState } {
  const { x: x0, y: y0, vx: vx0, vy: vy0, z: z0, vz: vz0 } = state0;
  const c = Math.cos(n * t);
  const s = Math.sin(n * t);

  const driftRate = secularDriftRate(state0, n);
  const drift: RelativeState = {
    x: 4 * x0 + (2 / n) * vy0,
    y: y0 - (2 / n) * vx0 + driftRate * t,
    z: 0,
    vx: 0,
    vy: driftRate,
    vz: 0,
  };

  const inPlane: RelativeState = {
    x: -3 * c * x0 + (s / n) * vx0 - (2 / n) * c * vy0,
    y: 6 * s * x0 + (2 / n) * c * vx0 + (4 / n) * s * vy0,
    z: 0,
    vx: 3 * n * s * x0 + c * vx0 + 2 * s * vy0,
    vy: 6 * n * c * x0 - 2 * s * vx0 + 4 * c * vy0,
    vz: 0,
  };

  const crossTrack: RelativeState = {
    x: 0,
    y: 0,
    z: z0 * c + (vz0 / n) * s,
    vx: 0,
    vy: 0,
    vz: -z0 * n * s + vz0 * c,
  };

  return { drift, inPlane, crossTrack };
}
