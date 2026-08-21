import type { Vector } from './rk4.ts';

export function matVec(m: number[][], v: Vector): Vector {
  return m.map((row) => row.reduce((sum, coeff, j) => sum + coeff * v[j], 0));
}

/** A (n x m) times B (m x p). */
export function matMul(a: number[][], b: number[][]): number[][] {
  const p = b[0].length;
  return a.map((row) => Array.from({ length: p }, (_, j) => row.reduce((sum, aik, k) => sum + aik * b[k][j], 0)));
}

export function transpose(a: number[][]): number[][] {
  const rows = a.length;
  const cols = a[0].length;
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => a[i][j]));
}

export function addMat(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function subMat(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function scaleMat(a: number[][], s: number): number[][] {
  return a.map((row) => row.map((v) => v * s));
}

export function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function outer(a: Vector, b: Vector): number[][] {
  return a.map((ai) => b.map((bj) => ai * bj));
}

/**
 * Solves A*X = B for X (A: n x n, B: n x p) via Gaussian elimination with partial pivoting.
 * Used in the iLQR backward pass to invert the (regularized, small: 2x2 for this demo's control
 * dimension) Quu block against both a vector RHS (feedforward d) and a matrix RHS (feedback K) --
 * a single generic solver instead of a hardcoded 2x2 closed-form inverse, so it isn't silently
 * wrong if the control dimension ever changes.
 */
export function solveLinearSystem(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const p = b[0].length;
  // Augmented working copy [A | B], row-major.
  const aug: number[][] = a.map((row, i) => [...row, ...b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let pivotMag = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > pivotMag) {
        pivotMag = Math.abs(aug[row][col]);
        pivotRow = row;
      }
    }
    if (pivotRow !== col) {
      [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];
    }
    const pivot = aug[col][col];
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      if (factor === 0) continue;
      for (let k = col; k < n + p; k++) {
        aug[row][k] -= factor * aug[col][k];
      }
    }
  }

  return aug.map((row, i) => row.slice(n).map((v) => v / aug[i][i]));
}

export function solveLinearVec(a: number[][], b: Vector): Vector {
  return solveLinearSystem(a, b.map((v) => [v])).map((row) => row[0]);
}
