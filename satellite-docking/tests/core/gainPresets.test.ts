import { describe, expect, it } from 'vitest';
import { inputMatrix, meanMotion, stateSpaceMatrix } from '../../src/core/dynamics/cw.ts';
import { closedLoopA, cumulativeEffort, simulateStateFeedback } from '../../src/core/control/closedLoopSim.ts';
import { GAIN_PRESETS } from '../../src/core/control/gainPresets.ts';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

const n = meanMotion(400);
const A = stateSpaceMatrix(n);
const B = inputMatrix();
const zeroRef = () => [0, 0, 0, 0, 0, 0];
const x0 = [0, -1000, 0, 0, 0, 0]; // the default "trailing" preset initial condition

// In-plane block: x, y, vx, vy are indices 0, 1, 3, 4; inputs ux, uy are K's rows 0, 1 and B's
// columns 0, 1. The CW A/B matrices block-decouple cross-track (z, vz only ever appear in the
// z row/column), so this slice is an exact reduction, not an approximation -- see
// gainPresets.ts's design comment.
function sliceInPlane(K: number[][]): { Ap: number[][]; Bp: number[][]; Kp: number[][] } {
  const idx = [0, 1, 3, 4];
  const Ap = idx.map((i) => idx.map((j) => A[i][j]));
  const Bp = idx.map((i) => [B[i][0], B[i][1]]);
  const Kp = [0, 1].map((i) => idx.map((j) => K[i][j]));
  return { Ap, Bp, Kp };
}

describe.each(GAIN_PRESETS)('gain preset "$id"', ({ id, build }) => {
  const K = build(n);

  it('stabilizes the full 6-state system (Hurwitz)', () => {
    const eigs = eigenDecompose(closedLoopA(A, B, K)).eigenvalues;
    for (const e of eigs) expect(e.re).toBeLessThan(-1e-9);
  });

  it('stabilizes the in-plane 2x4 block on its own', () => {
    const { Ap, Bp, Kp } = sliceInPlane(K);
    const eigs = eigenDecompose(closedLoopA(Ap, Bp, Kp)).eigenvalues;
    for (const e of eigs) expect(e.re).toBeLessThan(-1e-9);
  });

  it(`captures (within 5m) the default trailing preset inside the default window [id=${id}]`, () => {
    const { trajectory, diverged } = simulateStateFeedback(A, B, K, x0, zeroRef, [0, 4000], 1);
    expect(diverged).toBe(false);
    const final = trajectory.x[trajectory.x.length - 1];
    expect(Math.hypot(final[0], final[1], final[2])).toBeLessThan(5);
  });
});

describe('naive vs. tuned effort comparison', () => {
  it("the tuned preset's total control effort is meaningfully lower than the naive preset's", () => {
    const naiveK = GAIN_PRESETS.find((p) => p.id === 'naive')!.build(n);
    const tunedK = GAIN_PRESETS.find((p) => p.id === 'tuned')!.build(n);

    const naive = simulateStateFeedback(A, B, naiveK, x0, zeroRef, [0, 4000], 1);
    const tuned = simulateStateFeedback(A, B, tunedK, x0, zeroRef, [0, 4000], 1);

    const naiveEffort = cumulativeEffort(naive.trajectory.t, naive.u);
    const tunedEffort = cumulativeEffort(tuned.trajectory.t, tuned.u);

    const naiveTotal = naiveEffort[naiveEffort.length - 1];
    const tunedTotal = tunedEffort[tunedEffort.length - 1];

    // This is the demo's headline "team vs. Elon" comparison -- both gains do the job, but the
    // tuned one (coupling cancelled, then critically damped) does it for well under half the
    // control effort of the naive diagonal-PD design.
    expect(tunedTotal).toBeLessThan(naiveTotal / 2);
  });
});
