import type { Vector } from '../sim/rk4.ts';
import { G, INERTIA, MASS } from '../constants.ts';

export interface RocketParams {
  mass: number;
  inertia: number;
  g: number;
}

export const DEFAULT_ROCKET_PARAMS: RocketParams = { mass: MASS, inertia: INERTIA, g: G };

// State order [px, py, theta, vx, vy, omega], control order [T, tau] -- see
// ../types/rocketState.ts. theta is measured from vertical; thrust acts along the nose direction
// (sin theta, cos theta), so:
//   pdot_x = v_x
//   pdot_y = v_y
//   thetadot = omega
//   vdot_x = (T/m) sin(theta)
//   vdot_y = (T/m) cos(theta) - g
//   omegadot = tau / I
export function rocketDynamics(x: Vector, u: Vector, params: RocketParams = DEFAULT_ROCKET_PARAMS): Vector {
  const theta = x[2];
  const vx = x[3];
  const vy = x[4];
  const omega = x[5];
  const [T, tau] = u;
  const { mass, inertia, g } = params;
  return [vx, vy, omega, (T / mass) * Math.sin(theta), (T / mass) * Math.cos(theta) - g, tau / inertia];
}

/** Analytic partials of rocketDynamics w.r.t. state (Fx, 6x6) and control (Fu, 6x2), evaluated
 * at (x, u). Used directly in the iLQR linearization (see ../mpc/linearize.ts) -- kept in closed
 * form rather than finite-differenced, since this runs inside the solver's hot loop. */
export function rocketJacobians(
  x: Vector,
  u: Vector,
  params: RocketParams = DEFAULT_ROCKET_PARAMS,
): { Fx: number[][]; Fu: number[][] } {
  const theta = x[2];
  const T = u[0];
  const { mass, inertia } = params;
  const specificThrust = T / mass;

  const Fx = [
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
    [0, 0, specificThrust * Math.cos(theta), 0, 0, 0],
    [0, 0, -specificThrust * Math.sin(theta), 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ];

  const Fu = [
    [0, 0],
    [0, 0],
    [0, 0],
    [Math.sin(theta) / mass, 0],
    [Math.cos(theta) / mass, 0],
    [0, 1 / inertia],
  ];

  return { Fx, Fu };
}

/** Thrust that exactly balances weight at theta=0 -- the hover equilibrium, and a natural
 * warm-start for a fresh iLQR solve (see ../mpc/ilqr.ts). */
export function hoverThrust(params: RocketParams = DEFAULT_ROCKET_PARAMS): number {
  return params.mass * params.g;
}
