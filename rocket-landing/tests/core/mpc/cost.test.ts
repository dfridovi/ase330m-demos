import { describe, expect, it } from 'vitest';
import { stageCost, terminalCost } from '../../../src/core/mpc/cost.ts';
import { DEFAULT_WEIGHTS } from '../../../src/core/constants.ts';
import { fdHessian, fdJacobian } from '../fdJacobian.ts';

// The terminal cost's magnitude ranges into the thousands (terminalScale * qPos/qTheta * O(60)^2
// position/angle terms), so an absolute FD tolerance like vitest's toBeCloseTo(_, 6) is far too
// strict -- float64 roundoff on values of that size dwarfs 1e-6. Use a relative tolerance instead.
function expectRelClose(actual: number, expected: number, relTol = 1e-4): void {
  const scale = Math.max(1, Math.abs(expected));
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(relTol * scale);
}

// Away from py = 0 (and away from THETA_APPROACH_HEIGHT = 15) so the ground penalty's and the
// theta-approach-boost's kinks don't corrupt the finite-difference checks. Test point 3 sits
// inside the 0 < py < 15 approach band specifically to exercise thetaApproachMultiplier's
// theta/py cross-Hessian term, which the other (py > 15) points leave at zero.
const points: Array<{ x: number[]; u: number[] }> = [
  { x: [10, 40, 0.1, 2, -3, 0.1], u: [15000, 500] },
  { x: [-5, 20, -0.4, -1, 1, -0.2], u: [5000, -1000] },
  { x: [3, 60, 0.05, 0.5, -0.5, 0.05], u: [12000, 100] },
  { x: [2, 7, 0.15, 0.3, -2, 0.05], u: [11000, 200] },
];
const N = 50;

describe('stageCost', () => {
  for (const [i, { x, u }] of points.entries()) {
    it(`gradient matches finite difference at test point ${i}`, () => {
      const { lx, lu } = stageCost(x, u, DEFAULT_WEIGHTS, N);
      const gradX = fdJacobian((xi) => [stageCost(xi, u, DEFAULT_WEIGHTS, N).value], x)[0];
      const gradU = fdJacobian((ui) => [stageCost(x, ui, DEFAULT_WEIGHTS, N).value], u)[0];
      lx.forEach((v, k) => expectRelClose(v, gradX[k]));
      lu.forEach((v, k) => expectRelClose(v, gradU[k]));
    });

    it(`Hessian matches finite difference at test point ${i}`, () => {
      const { lxx, luu } = stageCost(x, u, DEFAULT_WEIGHTS, N);
      const hessX = fdHessian((xi) => stageCost(xi, u, DEFAULT_WEIGHTS, N).value, x);
      const hessU = fdHessian((ui) => stageCost(x, ui, DEFAULT_WEIGHTS, N).value, u);
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          expectRelClose(lxx[r][c], hessX[r][c]);
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          expectRelClose(luu[r][c], hessU[r][c]);
        }
      }
    });
  }

  it('penalizes going below the pad and has zero penalty above it', () => {
    const above = stageCost([0, 5, 0, 0, 0, 0], [0, 0], DEFAULT_WEIGHTS, N);
    const below = stageCost([0, -5, 0, 0, 0, 0], [0, 0], DEFAULT_WEIGHTS, N);
    expect(below.value).toBeGreaterThan(above.value);
  });
});

describe('terminalCost', () => {
  for (const [i, { x }] of points.entries()) {
    it(`gradient matches finite difference at test point ${i}`, () => {
      const { lx } = terminalCost(x, DEFAULT_WEIGHTS);
      const gradX = fdJacobian((xi) => [terminalCost(xi, DEFAULT_WEIGHTS).value], x)[0];
      lx.forEach((v, k) => expectRelClose(v, gradX[k]));
    });

    it(`Hessian matches finite difference at test point ${i}`, () => {
      const { lxx } = terminalCost(x, DEFAULT_WEIGHTS);
      const hessX = fdHessian((xi) => terminalCost(xi, DEFAULT_WEIGHTS).value, x);
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          expectRelClose(lxx[r][c], hessX[r][c]);
        }
      }
    });
  }

  it('has zero control gradient/Hessian', () => {
    const { lu, luu } = terminalCost([1, 2, 3, 4, 5, 6], DEFAULT_WEIGHTS);
    expect(lu).toEqual([0, 0]);
    expect(luu).toEqual([[0, 0], [0, 0]]);
  });
});
