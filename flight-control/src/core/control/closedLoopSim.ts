import type { StateSpace } from '../types/stateSpace.ts';
import type { Trajectory, Vector } from '../sim/rk4.ts';
import { integrate } from '../sim/rk4.ts';
import { matVec } from '../sim/simulate.ts';
import { eigenDecompose } from '../linalg/eig.ts';
import type { ReferenceSignal } from './referenceSignals.ts';

// State components here are O(1-10) in SI units (m/s, rad, rad/s) — anything past this is a
// runaway instability, not a legitimately large but slow physical trend, so it's safe to treat
// as "diverged" and stop advancing the simulation/animation instead of feeding huge or NaN
// numbers into the charts and 3D scene.
const DIVERGENCE_NORM = 1e4;

// Aggressive gains can push closed-loop poles far faster than the open-loop phugoid/short-
// period timescales the caller's requested dt was tuned for. Fixed-step RK4 is only
// numerically stable for dt*|lambda| roughly under ~2.785 on the negative real axis (tighter
// for complex poles) — exceeding that produces a *numerical* blow-up that looks identical to a
// genuine instability but isn't one. SAFETY_MARGIN keeps dt comfortably inside that region for
// any closed-loop pole; MIN_DT bounds the resulting step count for pathologically large K.
const RK4_STABILITY_SAFETY_MARGIN = 1.0;
const MIN_DT = 1e-3;

/** A - B*K for a single-input plant (B an n x 1 column, K a length-n row vector), i.e. the
 * closed-loop state matrix under u = -K*(x - x_ref). Reused wherever the closed-loop poles
 * (eig(A - BK)) are needed. */
export function closedLoopA(stateSpace: StateSpace, K: Vector): number[][] {
  const { A, B } = stateSpace;
  return A.map((row, i) => row.map((aij, j) => aij - B[i][0] * K[j]));
}

/** Shrinks the requested dt, if needed, so fixed-step RK4 stays numerically stable against
 * the fastest closed-loop pole — see the module-level comment on RK4_STABILITY_SAFETY_MARGIN. */
function stableStepSize(closedLoopMatrix: number[][], requestedDt: number): number {
  const maxPoleMagnitude = Math.max(
    ...eigenDecompose(closedLoopMatrix).eigenvalues.map((e) => Math.hypot(e.re, e.im)),
    1e-9,
  );
  const stabilityBound = RK4_STABILITY_SAFETY_MARGIN / maxPoleMagnitude;
  return Math.max(MIN_DT, Math.min(requestedDt, stabilityBound));
}

export interface ClosedLoopResult {
  trajectory: Trajectory;
  /** True if the response was truncated because the state norm blew up before reaching tSpan[1]. */
  diverged: boolean;
}

/**
 * Simulates the closed loop xdot = Ax + Bu, u = -K.(x - x_ref(t)), recomputing u from the
 * current state at every RK4 stage (rather than precomputing A - BK as the ODE's system
 * matrix) since x_ref is time-varying and not folded into a fixed forcing term.
 */
export function simulateStateFeedback(
  stateSpace: StateSpace,
  K: Vector,
  x0: Vector,
  xRef: ReferenceSignal,
  tSpan: [number, number],
  dt: number,
): ClosedLoopResult {
  const { A, B } = stateSpace;

  const derivative = (t: number, x: Vector): Vector => {
    const ref = xRef(t);
    const u = -K.reduce((sum, k, i) => sum + k * (x[i] - ref[i]), 0);
    const ax = matVec(A, x);
    const bu = matVec(B, [u]);
    return ax.map((v, i) => v + bu[i]);
  };

  const stableDt = stableStepSize(closedLoopA(stateSpace, K), dt);
  const full = integrate(derivative, x0, tSpan[0], tSpan[1], stableDt);

  let cutoff = full.x.length;
  for (let i = 0; i < full.x.length; i++) {
    const norm = Math.hypot(...full.x[i]);
    if (!Number.isFinite(norm) || norm > DIVERGENCE_NORM) {
      cutoff = i;
      break;
    }
  }

  if (cutoff === full.x.length) return { trajectory: full, diverged: false };
  const kept = Math.max(cutoff, 1);
  return {
    trajectory: { t: full.t.slice(0, kept), x: full.x.slice(0, kept) },
    diverged: true,
  };
}
