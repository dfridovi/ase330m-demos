import type { Trajectory, Vector } from './rk4.ts';

export function matVec(m: number[][], v: Vector): Vector {
  return m.map((row) => row.reduce((sum, coeff, j) => sum + coeff * v[j], 0));
}

export interface LongitudinalKinematics {
  /** Horizontal distance traveled (m), purely for visualization — not part of the state vector. */
  x: number[];
  /** Altitude gained relative to trim (m), purely for visualization. */
  altitude: number[];
  /** [x, altitude] pairs as a Trajectory, pre-built so per-frame sampling (e.g. in the 3D
   * animation loop) never has to re-zip the two arrays together. */
  positionTrajectory: Trajectory;
}

/**
 * Integrates approximate horizontal/vertical kinematics from the longitudinal state
 * trajectory [du, alpha, q, theta] so the 3D animation can show translational motion, even
 * though position is not part of the 4-state small-perturbation model.
 */
export function deriveLongitudinalKinematics(trajectory: Trajectory, trimSpeed: number): LongitudinalKinematics {
  const x: number[] = [0];
  const altitude: number[] = [0];
  const position: Vector[] = [[0, 0]];
  for (let i = 1; i < trajectory.t.length; i++) {
    const dt = trajectory.t[i] - trajectory.t[i - 1];
    const [du, alpha, , theta] = trajectory.x[i - 1];
    const xDot = trimSpeed + du;
    const altDot = trimSpeed * (theta - alpha);
    x.push(x[i - 1] + xDot * dt);
    altitude.push(altitude[i - 1] + altDot * dt);
    position.push([x[i], altitude[i]]);
  }
  return { x, altitude, positionTrajectory: { t: trajectory.t, x: position } };
}
