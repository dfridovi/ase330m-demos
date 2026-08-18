import { Matrix, solve } from 'ml-matrix';
import type { StateSpace } from '../types/stateSpace.ts';
import type { Vector } from '../sim/rk4.ts';
import { closedLoopA } from './closedLoopSim.ts';

export interface FrequencyPoint {
  omega: number;
  magnitude: number;
  phase: number; // radians
}

/**
 * Closed-loop frequency response from a single active reference channel (index refIndex of
 * x_ref) to a chosen observed output state (index outIndex), evaluated at each omega. Since B
 * is a single column and the reference-forcing term for one active channel is K[refIndex]*B (a
 * scalar multiple of B — see closedLoopSim.ts's module comment), this is
 * G(iw) = K[refIndex] * C_out (iwI - (A-BK))^-1 B, evaluated via a real 2n x 2n block linear
 * solve (stacking Re/Im parts of the resolvent) rather than complex-matrix arithmetic:
 *   [ -Acl   -wI ] [vr]   [B]
 *   [  wI   -Acl ] [vi] = [0]
 * so that C_out . (vr + i vi) = C_out (iwI - Acl)^-1 B.
 */
export function closedLoopFrequencyResponse(
  stateSpace: StateSpace,
  K: Vector,
  refIndex: number,
  outIndex: number,
  omegas: number[],
): FrequencyPoint[] {
  const Acl = closedLoopA(stateSpace, K);
  const n = Acl.length;
  const gain = K[refIndex];
  const b = stateSpace.B.map((row) => row[0]);

  return omegas.map((omega) => {
    const block = Array.from({ length: 2 * n }, (_, row) =>
      Array.from({ length: 2 * n }, (_, col) => {
        if (row < n && col < n) return -Acl[row][col];
        if (row < n) return row === col - n ? -omega : 0;
        if (col < n) return row - n === col ? omega : 0;
        return -Acl[row - n][col - n];
      }),
    );
    const rhs = Array.from({ length: 2 * n }, (_, i) => (i < n ? b[i] : 0));
    const v = solve(new Matrix(block), Matrix.columnVector(rhs)).to1DArray();
    const re = gain * v[outIndex];
    const im = gain * v[n + outIndex];
    return { omega, magnitude: Math.hypot(re, im), phase: Math.atan2(im, re) };
  });
}

export function logFrequencySweep(omegaMin: number, omegaMax: number, n: number): number[] {
  const logMin = Math.log10(omegaMin);
  const logMax = Math.log10(omegaMax);
  return Array.from({ length: n }, (_, i) => 10 ** (logMin + ((logMax - logMin) * i) / (n - 1)));
}
