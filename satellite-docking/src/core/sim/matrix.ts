import type { Vector } from './rk4.ts';

export function matVec(m: number[][], v: Vector): Vector {
  return m.map((row) => row.reduce((sum, coeff, j) => sum + coeff * v[j], 0));
}

/** A (n x m) times B (m x p) -- used for A - B*K (n x m times m x n) in closed-loop pole math. */
export function matMul(a: number[][], b: number[][]): number[][] {
  const p = b[0].length;
  return a.map((row) => Array.from({ length: p }, (_, j) => row.reduce((sum, aik, k) => sum + aik * b[k][j], 0)));
}
