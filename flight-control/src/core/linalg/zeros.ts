import { Matrix, determinant, solve } from 'ml-matrix';
import type { Complex } from './eig.ts';
import { eigenDecompose } from './eig.ts';

/**
 * Zeros of the strictly-proper SISO transfer function G(s) = C(sI-A)^-1 B (D=0), for B an
 * n x 1 column and C a 1 x n row. Rather than solving the generalized eigenvalue problem for
 * the classic "Rosenbrock system matrix" pencil (which ml-matrix has no built-in solver for),
 * this samples the numerator polynomial N(s) = det(sI-A) * G(s) at n real points, solves a
 * Vandermonde system for its (up to) degree-(n-1) coefficients, then finds the roots as
 * eigenvalues of that polynomial's companion matrix (reusing eigenDecompose).
 */
export function sisoZeros(A: number[][], B: number[][], C: number[][]): Complex[] {
  const n = A.length;
  const b = B.map((row) => row[0]);
  const c = C[0];

  // Real sample points, scaled by an irrational factor so they don't collide with A's
  // (generically rational-in-practice) real eigenvalues.
  const samplePoints = Array.from({ length: n }, (_, k) => (k + 1) * Math.SQRT2);

  const numeratorValues = samplePoints.map((s) => {
    const sIminusA = Matrix.eye(n).mul(s).sub(new Matrix(A));
    const det = determinant(sIminusA);
    const x = solve(sIminusA, Matrix.columnVector(b)).to1DArray();
    const g = c.reduce((sum, ci, i) => sum + ci * x[i], 0);
    return det * g;
  });

  // Vandermonde system for the numerator's coefficients c_0..c_{n-1}, N(s) = sum c_j s^j,
  // solved from N(samplePoints[k]) = numeratorValues[k].
  const vandermonde = samplePoints.map((s) => Array.from({ length: n }, (_, j) => s ** j));
  const coeffs = solve(new Matrix(vandermonde), Matrix.columnVector(numeratorValues)).to1DArray();

  // The true numerator degree is n-1 only when the system's relative degree is exactly 1;
  // higher relative degree means fewer zeros, leaving the corresponding high-order
  // coefficients ~0 here (within solve-noise of the largest coefficient) instead.
  const magnitude = Math.max(...coeffs.map(Math.abs), 1e-12);
  let degree = n - 1;
  while (degree > 0 && Math.abs(coeffs[degree]) < magnitude * 1e-8) degree--;
  if (degree === 0) return []; // constant numerator: no finite zeros

  // Roots of sum_{j=0}^{degree} coeffs[j]*s^j via the (Frobenius) companion matrix's
  // eigenvalues: monic form s^degree + sum_{j<degree} (coeffs[j]/leading)*s^j.
  const leading = coeffs[degree];
  const companion = Array.from({ length: degree }, (_, row) =>
    Array.from({ length: degree }, (_, col) =>
      col === degree - 1 ? -coeffs[row] / leading : row === col + 1 ? 1 : 0,
    ),
  );
  return eigenDecompose(companion).eigenvalues;
}
