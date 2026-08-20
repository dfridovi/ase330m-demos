import type { Trajectory, Vector } from '../sim/rk4.ts';
import { integrate } from '../sim/rk4.ts';
import { matMul, matVec } from '../sim/matrix.ts';
import { eigenDecompose } from '../linalg/eig.ts';

// State components here are O(1-1000) in SI units (m, m/s), so O(1e6) is a runaway
// instability, not a legitimately large but slow physical trend -- safe to treat as "diverged"
// and stop advancing the simulation instead of feeding huge or NaN numbers into the charts and
// 3D scene. Same guard as flight-control/src/core/control/closedLoopSim.ts, scaled up for this
// plant's much larger state magnitudes (km-scale positions vs. flight-control's O(1-10) states).
const DIVERGENCE_NORM = 1e6;

// Same RK4-stability reasoning as flight-control's closedLoopSim.ts: fixed-step RK4 is only
// numerically stable for dt*|lambda| roughly under ~2.785 on the negative real axis (tighter for
// complex poles), so a large stabilizing gain (fast closed-loop poles) needs a smaller step than
// a requested dt tuned for the much slower open-loop CW dynamics (n ~ 1e-3 rad/s).
const RK4_STABILITY_SAFETY_MARGIN = 1.0;
const MIN_DT = 1e-2;

/** A - B*K for a MIMO plant (B an n x m matrix, K an m x n matrix), i.e. the closed-loop state
 * matrix under u = -K*(x - x_ref). */
export function closedLoopA(A: number[][], B: number[][], K: number[][]): number[][] {
  const BK = matMul(B, K);
  return A.map((row, i) => row.map((aij, j) => aij - BK[i][j]));
}

/** Shrinks the requested dt, if needed, so fixed-step RK4 stays numerically stable against the
 * fastest closed-loop pole -- see the module-level comment on RK4_STABILITY_SAFETY_MARGIN. */
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
  /** Control input u(t) sampled at the same times as trajectory.t -- needed for the effort
   * integral (cumulativeEffort). */
  u: Vector[];
  /** True if the response was truncated because the state norm blew up before reaching tSpan[1]. */
  diverged: boolean;
}

/**
 * Simulates the closed loop xdot = Ax + Bu, u = -K.(x - x_ref(t)) for a MIMO plant (K, B
 * matrices; u, x vectors), recomputing u from the current state at every RK4 stage.
 */
export function simulateStateFeedback(
  A: number[][],
  B: number[][],
  K: number[][],
  x0: Vector,
  xRef: (t: number) => Vector,
  tSpan: [number, number],
  dt: number,
): ClosedLoopResult {
  const computeU = (t: number, x: Vector): Vector => {
    const ref = xRef(t);
    const error = x.map((xi, i) => xi - ref[i]);
    return matVec(K, error).map((v) => -v);
  };

  const derivative = (t: number, x: Vector): Vector => {
    const u = computeU(t, x);
    const ax = matVec(A, x);
    const bu = matVec(B, u);
    return ax.map((v, i) => v + bu[i]);
  };

  const stableDt = stableStepSize(closedLoopA(A, B, K), dt);
  const full = integrate(derivative, x0, tSpan[0], tSpan[1], stableDt);

  let cutoff = full.x.length;
  for (let i = 0; i < full.x.length; i++) {
    const norm = Math.hypot(...full.x[i]);
    if (!Number.isFinite(norm) || norm > DIVERGENCE_NORM) {
      cutoff = i;
      break;
    }
  }

  const kept = cutoff === full.x.length ? full.x.length : Math.max(cutoff, 1);
  const trajectory: Trajectory = { t: full.t.slice(0, kept), x: full.x.slice(0, kept) };
  const u = trajectory.t.map((t, i) => computeU(t, trajectory.x[i]));
  return { trajectory, u, diverged: kept !== full.x.length };
}

/** Trapezoidal cumulative control energy integral(0..t) u'u dt, sampled at each trajectory time
 * -- the same quantity clohessy_wiltshire_inputs.m integrates to compare gain designs' fuel use. */
export function cumulativeEffort(times: number[], u: Vector[]): number[] {
  const effort: number[] = [0];
  for (let i = 1; i < times.length; i++) {
    const dt = times[i] - times[i - 1];
    const uSqPrev = u[i - 1].reduce((sum, v) => sum + v * v, 0);
    const uSqCurr = u[i].reduce((sum, v) => sum + v * v, 0);
    effort.push(effort[i - 1] + (0.5 * (uSqPrev + uSqCurr)) * dt);
  }
  return effort;
}
