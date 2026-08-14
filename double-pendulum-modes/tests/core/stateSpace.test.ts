import { describe, expect, it } from 'vitest';
import { assembleStateSpace } from '../../src/core/dynamics/stateSpace.ts';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

describe('assembleStateSpace', () => {
  it('matches the course reference matlab-scripts/double_pendulum.m fixed matrix at m1=m2=l1=l2=g=1', () => {
    const { A } = assembleStateSpace({ m1: 1, m2: 1, l1: 1, l2: 1, g: 1 });
    expect(A).toEqual([
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [-2, 1, 0, 0],
      [2, -2, 0, 0],
    ]);
  });

  it('has the expected sparsity structure (kinematic thetadot rows, symmetric-in-form angular-accel block)', () => {
    const { A, B } = assembleStateSpace({ m1: 1, m2: 2, l1: 1.2, l2: 0.8, g: 9.81 });
    expect(A[0]).toEqual([0, 0, 1, 0]);
    expect(A[1]).toEqual([0, 0, 0, 1]);
    expect(A[2][2]).toBe(0);
    expect(A[2][3]).toBe(0);
    expect(A[3][2]).toBe(0);
    expect(A[3][3]).toBe(0);
    expect(B.flat().every((v) => v === 0)).toBe(true);
  });

  it('produces two undamped oscillatory modes for physically valid parameters', () => {
    const { A } = assembleStateSpace({ m1: 1.5, m2: 0.7, l1: 0.9, l2: 1.3, g: 9.81 });
    const { eigenvalues } = eigenDecompose(A);
    const oscillatory = eigenvalues.filter((e) => e.im > 0);
    expect(oscillatory).toHaveLength(2);
    // Undamped (no friction in this model): eigenvalues are purely imaginary.
    for (const e of oscillatory) expect(e.re).toBeCloseTo(0, 9);
  });

  it('scales natural frequencies by sqrt(g) for otherwise-identical geometry', () => {
    const low = eigenDecompose(assembleStateSpace({ m1: 1, m2: 1, l1: 1, l2: 1, g: 1 }).A);
    const high = eigenDecompose(assembleStateSpace({ m1: 1, m2: 1, l1: 1, l2: 1, g: 4 }).A);
    const wnLow = low.eigenvalues.filter((e) => e.im > 0).map((e) => e.im).sort((a, b) => a - b);
    const wnHigh = high.eigenvalues.filter((e) => e.im > 0).map((e) => e.im).sort((a, b) => a - b);
    for (let i = 0; i < wnLow.length; i++) {
      expect(wnHigh[i]).toBeCloseTo(wnLow[i] * 2, 6); // sqrt(4/1) = 2
    }
  });
});
