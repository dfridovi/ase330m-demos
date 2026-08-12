import { describe, expect, it } from 'vitest';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((sum, c, j) => sum + c * v[j], 0));
}

/** For every eigenpair, verify A*vr = lr*vr - li*vi and A*vi = li*vr + lr*vi
 * (the real/imaginary split of the complex eigenvalue equation A*v = lambda*v). */
function expectSatisfiesEigenEquation(A: number[][]) {
  const { eigenvalues, eigenvectorMatrixReal, eigenvectorMatrixImag } = eigenDecompose(A);
  const n = A.length;
  for (let col = 0; col < n; col++) {
    const vr = eigenvectorMatrixReal.map((row) => row[col]);
    const vi = eigenvectorMatrixImag.map((row) => row[col]);
    const { re: lr, im: li } = eigenvalues[col];
    const Avr = matVec(A, vr);
    const Avi = matVec(A, vi);
    for (let row = 0; row < n; row++) {
      expect(Avr[row]).toBeCloseTo(lr * vr[row] - li * vi[row], 6);
      expect(Avi[row]).toBeCloseTo(li * vr[row] + lr * vi[row], 6);
    }
  }
}

describe('eigenDecompose', () => {
  it('satisfies the eigenvalue equation for a matrix with a complex-conjugate pair', () => {
    expectSatisfiesEigenEquation([
      [0, -1],
      [1, 0],
    ]);
  });

  it('satisfies the eigenvalue equation for the reference longitudinal matrix', () => {
    expectSatisfiesEigenEquation([
      [-0.045, 0.036, 0, -32.2],
      [-0.369, -2.02, 176, 0],
      [0.0019, -0.0396, -2.948, 0],
      [0, 0, 1, 0],
    ]);
  });

  it('satisfies the eigenvalue equation for an all-real-eigenvalue matrix', () => {
    expectSatisfiesEigenEquation([
      [-1, 0, 0],
      [0.5, -2, 0],
      [0, 0.3, -3],
    ]);
  });
});
