import { describe, expect, it } from 'vitest';
import { inputMatrix, meanMotion, stateSpaceMatrix } from '../../src/core/dynamics/cw.ts';
import { simulateStateFeedback } from '../../src/core/control/closedLoopSim.ts';
import { GAIN_PRESETS } from '../../src/core/control/gainPresets.ts';

const n = meanMotion(400); // ISS-like altitude, matching cw-dynamics/flight-control's convention
const A = stateSpaceMatrix(n);
const B = inputMatrix();
const zeroRef = () => [0, 0, 0, 0, 0, 0];
const x0 = [0, -1000, 0, 0, 0, 0]; // trailing 1km along-track, at rest

function zeroK(): number[][] {
  return [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ];
}

describe('simulateStateFeedback', () => {
  it('a stabilizing K brings the chaser much closer than the open loop (K=0)', () => {
    const openLoop = simulateStateFeedback(A, B, zeroK(), x0, zeroRef, [0, 4000], 1);
    const tunedK = GAIN_PRESETS.find((p) => p.id === 'tuned')!.build(n);
    const closedLoop = simulateStateFeedback(A, B, tunedK, x0, zeroRef, [0, 4000], 1);

    expect(openLoop.diverged).toBe(false);
    expect(closedLoop.diverged).toBe(false);

    const openLoopFinal = openLoop.trajectory.x[openLoop.trajectory.x.length - 1];
    const closedLoopFinal = closedLoop.trajectory.x[closedLoop.trajectory.x.length - 1];
    const openLoopFinalDist = Math.hypot(openLoopFinal[0], openLoopFinal[1], openLoopFinal[2]);
    const closedLoopFinalDist = Math.hypot(closedLoopFinal[0], closedLoopFinal[1], closedLoopFinal[2]);
    expect(closedLoopFinalDist).toBeLessThan(5); // captured
    expect(closedLoopFinalDist).toBeLessThan(openLoopFinalDist / 100);
  });

  it('a destabilizing K trips the divergence guard and truncates the trajectory', () => {
    // Negated position/rate gains on every axis -- positive feedback instead of negative --
    // pumps energy into the along-track channel the x0 preset actually excites (y0 = -1000),
    // rather than relying on the weak Coriolis coupling to excite an untouched channel.
    const destabilizingK = [
      [-1e-3, 0, 0, -0.05, 0, 0],
      [0, -1e-3, 0, 0, -0.05, 0],
      [0, 0, -1e-3, 0, 0, -0.05],
    ];
    const { trajectory, diverged } = simulateStateFeedback(A, B, destabilizingK, x0, zeroRef, [0, 4000], 1);
    expect(diverged).toBe(true);
    expect(trajectory.t[trajectory.t.length - 1]).toBeLessThan(4000);
    for (const x of trajectory.x) {
      expect(x.every(Number.isFinite)).toBe(true);
    }
  });

  it('a large stabilizing gain does not report false divergence from RK4 numerical instability', () => {
    // wn=0.3 rad/s is ~100x TUNED_WN -- a genuinely fast but analytically stable closed-loop
    // pole (critically damped at -0.3), which a fixed step tuned for the much slower open-loop
    // CW dynamics would badly violate RK4's stability bound for without the adaptive-dt fix.
    const fastK = [
      [3 * n * n + 0.09, 0, 0, 0.6, 2 * n, 0],
      [0, 0.09, 0, -2 * n, 0.6, 0],
      [0, 0, 0.09 - n * n, 0, 0, 0.6],
    ];
    const { diverged } = simulateStateFeedback(A, B, fastK, x0, zeroRef, [0, 100], 1);
    expect(diverged).toBe(false);
  });
});
