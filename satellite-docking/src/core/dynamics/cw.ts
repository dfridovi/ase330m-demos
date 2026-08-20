import { MU_EARTH, R_EARTH } from '../constants';

// Mean motion n = sqrt(mu / a^3) of a circular chief orbit at the given altitude. Same formula
// as ../../../cw-dynamics/src/core/dynamics/cw.ts.
export function meanMotion(altitudeKm: number): number {
  const a = R_EARTH + altitudeKm * 1000;
  return Math.sqrt(MU_EARTH / (a * a * a));
}

export function orbitalPeriod(n: number): number {
  return (2 * Math.PI) / n;
}

// The linearized Clohessy-Wiltshire / Hill state matrix, state order [x, y, z, vx, vy, vz] --
// the same A the free-response cw-dynamics demo uses (and the same as
// clohessy_wiltshire_inputs.m), but here it's fed to a numerical RK4 + eigenvalue pipeline
// instead of the closed-form solution: state feedback is expected to move the repeated zero
// eigenvalue (a single 2x2 Jordan block) that made the closed form necessary there (see that
// demo's Scope section),
// so a plain xdot = (A - BK)x integration is the right tool once u is in the loop.
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

// Translational thruster input matrix: u = [ux, uy, uz] is specific force (m/s^2) applied
// directly along radial/along-track/cross-track, i.e. unit chaser mass -- same B as
// clohessy_wiltshire_inputs.m, with no separate mass/thruster model layered on top.
export function inputMatrix(): number[][] {
  return [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}
