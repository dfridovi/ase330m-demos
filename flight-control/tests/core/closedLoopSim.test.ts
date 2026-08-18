import { describe, expect, it } from 'vitest';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import { GENERAL_AVIATION } from '../../src/core/aero/presets.ts';
import { simulateStateFeedback } from '../../src/core/control/closedLoopSim.ts';
import { trimHoldReference } from '../../src/core/control/referenceSignals.ts';

describe('simulateStateFeedback', () => {
  const stateSpace = assembleLongitudinalStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.coefficients);
  const x0 = GENERAL_AVIATION.disturbanceX0;
  const xRef = trimHoldReference();

  it('a stabilizing K damps the disturbance faster than the open loop (K=0)', () => {
    const openLoop = simulateStateFeedback(stateSpace, [0, 0, 0, 0], x0, xRef, [0, 120], 0.02);
    const closedLoop = simulateStateFeedback(stateSpace, [0, 0, -5, -2], x0, xRef, [0, 120], 0.02);

    expect(openLoop.diverged).toBe(false);
    expect(closedLoop.diverged).toBe(false);

    const openLoopFinalNorm = Math.hypot(...openLoop.trajectory.x[openLoop.trajectory.x.length - 1]);
    const closedLoopFinalNorm = Math.hypot(...closedLoop.trajectory.x[closedLoop.trajectory.x.length - 1]);
    expect(closedLoopFinalNorm).toBeLessThan(openLoopFinalNorm / 10);
  });

  it('a destabilizing K trips the divergence guard and truncates the trajectory', () => {
    const { trajectory, diverged } = simulateStateFeedback(stateSpace, [0, 0, 5, 2], x0, xRef, [0, 60], 0.02);
    expect(diverged).toBe(true);
    expect(trajectory.t[trajectory.t.length - 1]).toBeLessThan(60);
    for (const x of trajectory.x) {
      expect(x.every(Number.isFinite)).toBe(true);
    }
  });

  it('a large stabilizing gain does not report false divergence from RK4 numerical instability', () => {
    // Before the adaptive step-size fix, a *stable* but very fast closed-loop pole (large |K|)
    // could still blow up numerically under a fixed step tuned for the slow open-loop
    // dynamics — this is a regression guard for that. eig(A-BK) for this K includes a pole
    // around -720 (analytically stable, ~4x faster than the [0,0,-5,-2] case above), which
    // the fixed 0.02s step would badly violate RK4's stability bound for without the fix.
    const { diverged } = simulateStateFeedback(stateSpace, [0, 0, -20, -10], x0, xRef, [0, 30], 0.02);
    expect(diverged).toBe(false);
  });
});
