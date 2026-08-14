import { eigenDecompose } from '../linalg/eig.ts';
import type { Mode, ModalSimulationResult } from '../sim/modalDecomposition.ts';
import type { Vector } from '../sim/rk4.ts';

/** Ascending by natural frequency, so "mode 0" is always the slower, in-phase swing and
 * "mode 1" the faster, anti-phase one — regardless of the order the underlying eigenvalue
 * decomposition happens to return them in. */
export function sortModesByFrequency(modes: Mode[]): Mode[] {
  return [...modes].sort((a, b) => (a.naturalFrequency ?? 0) - (b.naturalFrequency ?? 0));
}

/** Reorders a full modal simulation result (modes, their initial conditions, and their
 * simulated trajectories together) by ascending natural frequency. */
export function sortModalResult(modal: ModalSimulationResult): ModalSimulationResult {
  const order = modal.modes
    .map((mode, i) => ({ mode, i }))
    .sort((a, b) => (a.mode.naturalFrequency ?? 0) - (b.mode.naturalFrequency ?? 0))
    .map(({ i }) => i);
  return {
    modes: order.map((i) => modal.modes[i]),
    modeInitialConditions: order.map((i) => modal.modeInitialConditions[i]),
    fullResponse: modal.fullResponse,
    modeResponses: order.map((i) => modal.modeResponses[i]),
  };
}

/** theta2/theta1 ratio of a mode's real eigenvector: positive means the two pendulums swing
 * the same direction (in-phase), negative means opposite directions (anti-phase). */
export function modeShapeRatio(A: number[][], modeStartIndex: number): number {
  const { eigenvectorMatrixReal } = eigenDecompose(A);
  return eigenvectorMatrixReal[1][modeStartIndex] / eigenvectorMatrixReal[0][modeStartIndex];
}

/**
 * Builds an initial condition that lies purely along one mode's invariant subspace — i.e. its
 * free response contains only that single frequency, no beating with the other mode. Any
 * scalar multiple of the mode's real Schur eigenvector column has this property (see
 * decomposeModes: masking modal coordinates to one mode and mapping back through the same V
 * used here recovers exactly this vector), so scaling that column to a target theta1 amplitude
 * gives a "clean" demo initial condition without needing to solve for a starting phase.
 */
export function pureModeInitialCondition(A: number[][], modeStartIndex: number, targetTheta1Amplitude: number): Vector {
  const { eigenvectorMatrixReal } = eigenDecompose(A);
  const n = A.length;
  const column = Array.from({ length: n }, (_, row) => eigenvectorMatrixReal[row][modeStartIndex]);
  const scale = targetTheta1Amplitude / (Math.abs(column[0]) || 1);
  return column.map((v) => v * scale);
}
