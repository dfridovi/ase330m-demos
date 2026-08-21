import { describe, expect, it } from 'vitest';
import { coldStartTrajectory, rolloutFrom, solve } from '../../../src/core/mpc/ilqr.ts';
import { DEFAULT_WEIGHTS, DT, HORIZON_STEPS, PAD_X, PAD_Y, TAU_MAX, T_MAX } from '../../../src/core/constants.ts';

// A finite-horizon solve from far away isn't expected to *reach* the pad within one horizon --
// that's what repeated receding-horizon re-solving (see ../control/rtiSim.test.ts) is for. These
// tests check what a single solve() call should guarantee: cost decreases monotonically, a
// near-target start converges cleanly, a far-from-target start still visibly brakes relative to
// free-fall, and actuator limits are always respected.

function coldStartGuess(x0: number[]) {
  return coldStartTrajectory(x0, HORIZON_STEPS, DT);
}

describe('solve', () => {
  it('produces a non-increasing cost history', () => {
    const x0 = [15, 60, 0.2, 3, -6, 0.1];
    const result = solve(x0, coldStartGuess(x0), {
      dt: DT,
      weights: DEFAULT_WEIGHTS,
      maxIterations: 30,
      costTolerance: 1e-6,
    });

    for (let i = 1; i < result.costHistory.length; i++) {
      expect(result.costHistory[i]).toBeLessThanOrEqual(result.costHistory[i - 1] + 1e-9);
    }
    expect(result.costHistory.length).toBeGreaterThan(1);
  });

  it('converges within maxIterations for a start already near the pad', () => {
    const x0 = [2, 10, 0.02, 0.5, -3, 0];
    const result = solve(x0, coldStartGuess(x0), {
      dt: DT,
      weights: DEFAULT_WEIGHTS,
      maxIterations: 50,
      costTolerance: 1e-6,
    });
    expect(result.converged).toBe(true);

    const [px, py, theta, vx, vy, omega] = result.trajectory.states[HORIZON_STEPS];
    expect(Math.hypot(px - PAD_X, py - PAD_Y)).toBeLessThan(4);
    expect(Math.abs(theta)).toBeLessThan(0.2);
    expect(Math.hypot(vx, vy)).toBeLessThan(3);
    expect(Math.abs(omega)).toBeLessThan(0.5);
  });

  it('brakes relative to free fall for a start far above the pad', () => {
    const x0 = [5, 40, 0.05, 1, -4, 0];
    const result = solve(x0, coldStartGuess(x0), {
      dt: DT,
      weights: DEFAULT_WEIGHTS,
      maxIterations: 50,
      costTolerance: 1e-6,
    });

    const freeFall = rolloutFrom(
      x0,
      Array.from({ length: HORIZON_STEPS }, () => [0, 0]),
      DT,
    );
    const [, , , , vyFree] = freeFall.states[HORIZON_STEPS];
    const [px, py, , , vy] = result.trajectory.states[HORIZON_STEPS];

    // Over a 2.5s horizon starting 40m up, a single finite-horizon solve isn't expected to reach
    // the pad (that needs several receding-horizon re-solves -- see rtiSim.test.ts), but it
    // should visibly be braking and closing in on the pad rather than coasting or diverging.
    expect(Math.abs(vy)).toBeLessThan(Math.abs(vyFree));
    expect(py).toBeLessThan(x0[1]);
    expect(Math.hypot(px - PAD_X, py - PAD_Y)).toBeLessThan(Math.hypot(x0[0] - PAD_X, x0[1] - PAD_Y));
  });

  it('respects actuator limits along the whole solved trajectory', () => {
    const x0 = [20, 80, 0.3, 5, -10, 0.2];
    const result = solve(x0, coldStartGuess(x0), {
      dt: DT,
      weights: DEFAULT_WEIGHTS,
      maxIterations: 50,
      costTolerance: 1e-6,
    });

    for (const [T, tau] of result.trajectory.controls) {
      expect(T).toBeGreaterThanOrEqual(0);
      expect(T).toBeLessThanOrEqual(T_MAX);
      expect(Math.abs(tau)).toBeLessThanOrEqual(TAU_MAX);
    }
  });
});
