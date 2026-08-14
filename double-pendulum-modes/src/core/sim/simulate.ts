import type { StateSpace } from '../types/stateSpace.ts';
import type { Trajectory, Vector } from './rk4.ts';
import { integrate } from './rk4.ts';

function matVec(m: number[][], v: Vector): Vector {
  return m.map((row) => row.reduce((sum, coeff, j) => sum + coeff * v[j], 0));
}

export type InputSignal = (t: number) => Vector;

/** No forced input — this demo only shows the free (initial-condition) response. */
export function zeroInput(size = 1): InputSignal {
  const zero = Array(size).fill(0);
  return () => zero;
}

export interface SimulationOptions {
  x0: Vector;
  input: InputSignal;
  tSpan: [number, number];
  dt: number;
}

export function simulate(stateSpace: StateSpace, options: SimulationOptions): Trajectory {
  const { A, B } = stateSpace;
  const derivative = (t: number, x: Vector): Vector => {
    const u = options.input(t);
    const ax = matVec(A, x);
    const bu = matVec(B, u);
    return ax.map((v, i) => v + bu[i]);
  };
  return integrate(derivative, options.x0, options.tSpan[0], options.tSpan[1], options.dt);
}
