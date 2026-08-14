import { describe, expect, it } from 'vitest';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

describe('eigenDecompose', () => {
  it('finds real eigenvalues of a diagonal matrix', () => {
    const { eigenvalues } = eigenDecompose([
      [2, 0],
      [0, 3],
    ]);
    const values = eigenvalues.map((e) => e.re).sort((a, b) => a - b);
    expect(values).toEqual([2, 3]);
    expect(eigenvalues.every((e) => e.im === 0)).toBe(true);
  });

  it('finds a complex-conjugate pair for a rotation-like matrix', () => {
    const { eigenvalues } = eigenDecompose([
      [0, 1],
      [-1, 0],
    ]);
    expect(eigenvalues[0].re).toBeCloseTo(0, 9);
    expect(eigenvalues[1].re).toBeCloseTo(0, 9);
    expect(Math.abs(eigenvalues[0].im)).toBeCloseTo(1, 9);
    expect(eigenvalues[1].im).toBeCloseTo(-eigenvalues[0].im, 9);
  });

  it('reconstructs A = V * diag(eigenvalues) * V^-1 for a real eigenvector case', () => {
    const A = [
      [2, 0],
      [0, 3],
    ];
    const { eigenvalues, eigenvectorMatrixReal } = eigenDecompose(A);
    // For a diagonal matrix the eigenvectors are the standard basis (up to column order/scale);
    // check A*v = lambda*v directly instead of assuming column order.
    for (let col = 0; col < 2; col++) {
      const v = [eigenvectorMatrixReal[0][col], eigenvectorMatrixReal[1][col]];
      const Av = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
      expect(Av[0]).toBeCloseTo(eigenvalues[col].re * v[0], 9);
      expect(Av[1]).toBeCloseTo(eigenvalues[col].re * v[1], 9);
    }
  });
});
