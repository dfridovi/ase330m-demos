import type { StateSpace } from '../types/stateSpace.ts';
import type { Trajectory, Vector } from './rk4.ts';
import { integrate } from './rk4.ts';

function matVec(m: number[][], v: Vector): Vector {
  return m.map((row) => row.reduce((sum, coeff, j) => sum + coeff * v[j], 0));
}

export type InputSignal = (t: number) => Vector;

export function stepInput(magnitude: number, startTime = 0): InputSignal {
  return (t: number) => [t >= startTime ? magnitude : 0];
}

export function doubletInput(magnitude: number, startTime: number, halfDuration: number): InputSignal {
  return (t: number) => {
    if (t < startTime || t >= startTime + 2 * halfDuration) return [0];
    return [t < startTime + halfDuration ? magnitude : -magnitude];
  };
}

/** size=1 for the single-input (elevator) longitudinal system; pass 2 for the two-input
 * (aileron, rudder) lateral-directional system, otherwise matVec(B, u) indexes past the end
 * of a wider B and produces NaN. */
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

export interface LateralKinematics {
  /** Heading (rad), integrated directly from yaw rate r. */
  psi: number[];
  /** Ground-track position (m), east/north-style planar coordinates. */
  x: number[];
  z: number[];
  /** [x, z, psi] triples as a Trajectory, pre-built so per-frame sampling (heading included,
   * for the 3D animation's yaw) never has to re-zip three separate arrays together. */
  positionTrajectory: Trajectory;
}

/**
 * Integrates approximate ground-track kinematics from the lateral state trajectory
 * [beta, p, r, phi] so the 3D animation can show the airplane banking and turning, even
 * though ground position is not part of the 4-state small-perturbation model.
 *
 * Heading is integrated directly from the state's own yaw rate r (psi_dot = r), not the
 * classic coordinated-turn approximation psi_dot = (g/U0)*phi — that approximation only
 * holds for a *steady* turn and would visibly disagree with the actual r whenever dutch roll
 * is active, which is exactly the regime this tool is meant to visualize. Sideslip beta's
 * small effect on ground-track direction is ignored, at the same rigor level
 * deriveLongitudinalKinematics already uses for its own second-order terms.
 */
export function deriveLateralKinematics(trajectory: Trajectory, trimSpeed: number): LateralKinematics {
  const psi: number[] = [0];
  const x: number[] = [0];
  const z: number[] = [0];
  const position: Vector[] = [[0, 0, 0]];
  for (let i = 1; i < trajectory.t.length; i++) {
    const dt = trajectory.t[i] - trajectory.t[i - 1];
    const [, , r] = trajectory.x[i - 1];
    const prevPsi = psi[i - 1];
    const xDot = trimSpeed * Math.cos(prevPsi);
    const zDot = trimSpeed * Math.sin(prevPsi);
    psi.push(prevPsi + r * dt);
    x.push(x[i - 1] + xDot * dt);
    z.push(z[i - 1] + zDot * dt);
    position.push([x[i], z[i], psi[i]]);
  }
  return { psi, x, z, positionTrajectory: { t: trajectory.t, x: position } };
}
