import type { Vector } from '../sim/rk4.ts';
import { rk4Step } from '../sim/rk4.ts';
import { rocketDynamics, type RocketParams } from '../dynamics/rocket.ts';
import { coldStartTrajectory, type NominalTrajectory, solve } from '../mpc/ilqr.ts';
import {
  type CostWeights,
  FUEL_RATE_PER_THRUST,
  LANDING_SAFE_OMEGA,
  LANDING_SAFE_THETA,
  LANDING_SAFE_VX,
  LANDING_SAFE_VY,
  PAD_Y,
} from '../constants.ts';

export type LandingStatus = 'flying' | 'landed' | 'crashed';

export interface RtiState {
  realState: Vector;
  nominalTrajectory: NominalTrajectory;
  fuelRemaining: number;
  landingStatus: LandingStatus;
}

export interface RtiOptions {
  dt: number;
  horizonSteps: number;
  weights: CostWeights;
  params?: RocketParams;
  /** iLQR iterations to run this tick -- a couple for a live "real-time iteration" playback
   * tick (cheap, warm-started), many more for a fuller settle-to-convergence solve while paused
   * (see the plan's real-time interaction strategy). */
  iterations: number;
  costTolerance: number;
}

export interface RtiStepResult {
  next: RtiState;
  appliedControl: Vector;
  solverIterations: number;
  solverConverged: boolean;
  /** Cost after each accepted forward pass of this tick's solve, for the "iLQR cost vs.
   * iteration" chart -- empty when no solve ran (already landed/crashed, or already at/below
   * the pad). */
  costHistory: number[];
}

function evaluateTouchdown(x: Vector): LandingStatus {
  const [, , theta, vx, vy, omega] = x;
  const safe =
    Math.abs(vy) <= LANDING_SAFE_VY &&
    Math.abs(vx) <= LANDING_SAFE_VX &&
    Math.abs(theta) <= LANDING_SAFE_THETA &&
    Math.abs(omega) <= LANDING_SAFE_OMEGA;
  return safe ? 'landed' : 'crashed';
}

/** Shifts a solved nominal trajectory one step for warm-starting the next tick's solve: drop the
 * applied first control, and repeat the last control to keep the horizon full length. `solve()`
 * re-anchors the states to the actual current state itself, so only the control sequence needs
 * to be carried over here. */
function shiftControls(controls: Vector[]): Vector[] {
  return [...controls.slice(1), controls[controls.length - 1]];
}

export function initialRtiState(x0: Vector, options: RtiOptions, fuelRemaining: number): RtiState {
  return {
    realState: x0,
    nominalTrajectory: coldStartTrajectory(x0, options.horizonSteps, options.dt, options.params),
    fuelRemaining,
    landingStatus: 'flying',
  };
}

/**
 * One receding-horizon real-time-iteration tick: re-solve (warm-started from the shifted
 * previous nominal trajectory) for `options.iterations` iLQR iterations, apply the resulting
 * first control to the true nonlinear dynamics for `options.dt`, burn fuel proportional to
 * thrust, and check for touchdown. Pure function -- the store's tick() action is a thin wrapper
 * around this plus bookkeeping (history arrays for the charts).
 */
export function step(state: RtiState, options: RtiOptions): RtiStepResult {
  if (state.landingStatus !== 'flying') {
    return { next: state, appliedControl: [0, 0], solverIterations: 0, solverConverged: true, costHistory: [] };
  }

  if (state.realState[1] <= PAD_Y) {
    const landingStatus = evaluateTouchdown(state.realState);
    return {
      next: { ...state, landingStatus },
      appliedControl: [0, 0],
      solverIterations: 0,
      solverConverged: true,
      costHistory: [],
    };
  }

  const warmStart: NominalTrajectory = {
    states: state.nominalTrajectory.states,
    controls: shiftControls(state.nominalTrajectory.controls),
  };

  const solveResult = solve(state.realState, warmStart, {
    dt: options.dt,
    weights: options.weights,
    params: options.params,
    maxIterations: options.iterations,
    costTolerance: options.costTolerance,
  });

  const appliedControl = solveResult.trajectory.controls[0];
  const nextRealState = rk4Step((_t, x) => rocketDynamics(x, appliedControl, options.params), 0, state.realState, options.dt);
  const fuelBurned = FUEL_RATE_PER_THRUST * appliedControl[0] * options.dt;
  const fuelRemaining = Math.max(0, state.fuelRemaining - fuelBurned);

  // Running out of fuel while still airborne is an unrecoverable flame-out, regardless of how
  // gently it was descending -- this doesn't need to touch the (deliberately fuel-independent,
  // see the plan's Scope note) dynamics itself, just the outcome.
  const outOfFuel = fuelRemaining <= 0 && nextRealState[1] > PAD_Y;
  const landingStatus = outOfFuel ? 'crashed' : nextRealState[1] <= PAD_Y ? evaluateTouchdown(nextRealState) : 'flying';
  const clampedState = landingStatus !== 'flying' && nextRealState[1] <= PAD_Y ? nextRealState.with(1, PAD_Y) : nextRealState;

  return {
    next: {
      realState: clampedState,
      nominalTrajectory: solveResult.trajectory,
      fuelRemaining,
      landingStatus,
    },
    appliedControl,
    solverIterations: solveResult.iterations,
    solverConverged: solveResult.converged,
    costHistory: solveResult.costHistory,
  };
}
