// Planar rocket state: p_x, p_y (position, m), theta (pitch from vertical, rad), and their
// rates. theta = 0 means upright (nose pointing along +p_y); positive theta tips the nose toward
// +p_x. Same "plain array for the math, named interface for everything else" split as
// ../../../satellite-docking/src/core/types/relativeState.ts.
export interface RocketState {
  px: number;
  py: number;
  theta: number;
  vx: number;
  vy: number;
  omega: number;
}

// State order [px, py, theta, vx, vy, omega], matching rocketDynamics()/rocketJacobians().
export function stateToVector(state: RocketState): number[] {
  return [state.px, state.py, state.theta, state.vx, state.vy, state.omega];
}

export function vectorToState(v: number[]): RocketState {
  return { px: v[0], py: v[1], theta: v[2], vx: v[3], vy: v[4], omega: v[5] };
}

// Control order [T, tau]: T is main-engine thrust along the body's nose direction (T >= 0),
// tau is a net attitude-control torque (gimbal/RCS, decoupled from the fuel model -- see the
// README's Scope section).
export interface RocketControl {
  T: number;
  tau: number;
}

export function controlToVector(control: RocketControl): number[] {
  return [control.T, control.tau];
}

export function vectorToControl(v: number[]): RocketControl {
  return { T: v[0], tau: v[1] };
}
