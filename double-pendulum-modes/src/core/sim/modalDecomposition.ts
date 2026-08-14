import { EigenvalueDecomposition, inverse, Matrix } from 'ml-matrix';
import type { StateSpace } from '../types/stateSpace.ts';
import type { Complex } from '../linalg/eig.ts';
import type { Trajectory, Vector } from './rk4.ts';
import { simulate, zeroInput } from './simulate.ts';

export interface Mode {
  /** Indices into the eigenvalue list this mode spans: length 2 for a complex-conjugate
   * pair (an oscillatory mode), length 1 for a real eigenvalue (a first-order mode). */
  indices: number[];
  eigenvalues: Complex[];
  naturalFrequency?: number; // rad/s, only defined for oscillatory (complex-pair) modes
  dampingRatio?: number; // only defined for oscillatory modes
  timeConstant?: number; // seconds, only defined for real (first-order) modes
}

export interface ModalDecompositionResult {
  modes: Mode[];
  /** x0 decomposed into each mode's own initial-condition contribution, same order as modes. */
  modeInitialConditions: Vector[];
}

/**
 * Splits the free response of xdot = Ax, x(0) = x0, into per-mode contributions using the
 * real Schur / real-canonical eigenbasis: A = V * Lambda_real * V^-1, where V is real even
 * when eigenvalues are complex (ml-matrix packs conjugate-pair eigenvectors as [Re, Im]
 * columns). Masking modal coordinates to a single mode and mapping back through V therefore
 * stays entirely real, unlike the naive complex-eigenvector version (which needs `real(...)`
 * after reconstruction, as in the course's MATLAB examples).
 */
export function decomposeModes(A: number[][], x0: Vector): ModalDecompositionResult {
  const n = A.length;
  const decomposition = new EigenvalueDecomposition(new Matrix(A));
  const re = decomposition.realEigenvalues;
  const im = decomposition.imaginaryEigenvalues;
  const V = decomposition.eigenvectorMatrix;
  const Vinv = inverse(V);
  const w0 = Vinv.mmul(Matrix.columnVector(x0));

  const modes: Mode[] = [];
  let i = 0;
  while (i < n) {
    if (im[i] > 0 && i + 1 < n && Math.abs(im[i + 1] + im[i]) < 1e-9) {
      const wn = Math.hypot(re[i], im[i]);
      modes.push({
        indices: [i, i + 1],
        eigenvalues: [
          { re: re[i], im: im[i] },
          { re: re[i + 1], im: im[i + 1] },
        ],
        naturalFrequency: wn,
        dampingRatio: wn === 0 ? undefined : -re[i] / wn,
      });
      i += 2;
    } else {
      modes.push({
        indices: [i],
        eigenvalues: [{ re: re[i], im: im[i] }],
        timeConstant: re[i] === 0 ? undefined : -1 / re[i],
      });
      i += 1;
    }
  }

  const modeInitialConditions = modes.map((mode) => {
    const wMasked = Matrix.zeros(n, 1);
    for (const idx of mode.indices) wMasked.set(idx, 0, w0.get(idx, 0));
    return V.mmul(wMasked).to1DArray();
  });

  return { modes, modeInitialConditions };
}

export interface ModalSimulationResult extends ModalDecompositionResult {
  fullResponse: Trajectory;
  modeResponses: Trajectory[];
}

/** Free response (zero input) decomposed into per-mode trajectories, plus the full response. */
export function simulateModes(
  stateSpace: StateSpace,
  x0: Vector,
  tSpan: [number, number],
  dt: number,
): ModalSimulationResult {
  const decomposition = decomposeModes(stateSpace.A, x0);
  const noInput = zeroInput(stateSpace.B[0]?.length ?? 1);
  const fullResponse = simulate(stateSpace, { x0, input: noInput, tSpan, dt });
  const modeResponses = decomposition.modeInitialConditions.map((modeX0) =>
    simulate(stateSpace, { x0: modeX0, input: noInput, tSpan, dt }),
  );
  return { ...decomposition, fullResponse, modeResponses };
}
