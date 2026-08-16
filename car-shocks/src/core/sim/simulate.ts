import type { CarParams, SeriesPoint } from '../types/params.ts';
import { getStateSpace } from '../dynamics/quarterCar.ts';
import { rk4Step } from './rk4.ts';

type State = [number, number]; // [x, xdot]

function addScaled(a: State, b: State, scale: number): State {
  return [a[0] + scale * b[0], a[1] + scale * b[1]];
}

// ż = A z + B f(t), f(t) = f0 sin(omega t), z(0) = [0, 0].
// Integrated numerically (RK4) from rest so the transient build-up into steady state
// is visible, rather than jumping straight to the closed-form steady-state amplitude/phase.
export function simulatePeriodicResponse(
  params: CarParams & { f0: number; omega: number },
  tEnd: number,
  n: number,
): SeriesPoint[] {
  const { f0, omega } = params;
  const { A, B } = getStateSpace(params);

  const deriv = (t: number, z: State): State => {
    const force = f0 * Math.sin(omega * t);
    return [
      A[0][0] * z[0] + A[0][1] * z[1],
      A[1][0] * z[0] + A[1][1] * z[1] + B[1] * force,
    ];
  };

  const dt = tEnd / (n - 1);
  const points: SeriesPoint[] = [];
  let z: State = [0, 0];
  let t = 0;
  points.push({ t, x: z[0], xdot: z[1], f: f0 * Math.sin(omega * t) });
  for (let i = 1; i < n; i++) {
    z = rk4Step(deriv, t, z, dt, addScaled);
    t += dt;
    points.push({ t, x: z[0], xdot: z[1], f: f0 * Math.sin(omega * t) });
  }
  return points;
}
