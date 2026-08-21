import type { Vector } from '../sim/rk4.ts';
import { rk4Step } from '../sim/rk4.ts';
import { addMat, identity, matMul, matVec, scaleMat, solveLinearSystem, solveLinearVec, transpose } from '../sim/matrix.ts';
import { hoverThrust, rocketDynamics, type RocketParams } from '../dynamics/rocket.ts';
import { linearizedStep } from './linearize.ts';
import { stageCost, terminalCost } from './cost.ts';
import { type CostWeights, T_MAX, TAU_MAX } from '../constants.ts';

export interface NominalTrajectory {
  states: Vector[]; // length N+1
  controls: Vector[]; // length N
}

export interface SolveOptions {
  dt: number;
  weights: CostWeights;
  params?: RocketParams;
  maxIterations: number;
  costTolerance: number; // relative improvement below which the solve is considered converged
}

export interface SolveResult {
  trajectory: NominalTrajectory;
  cost: number;
  iterations: number;
  converged: boolean;
  /** Cost after each accepted forward pass, in order -- non-increasing by construction (the
   * Armijo condition rejects any step that doesn't decrease cost enough). Exposed for both
   * testing and the math panel's "solver converged in N iterations" readout. */
  costHistory: number[];
}

const INITIAL_LAMBDA = 1e-6;
const LAMBDA_FACTOR = 10;
const LAMBDA_MAX = 1e8;
const LAMBDA_MIN = 1e-9;
const MAX_REGULARIZATION_ESCALATIONS = 20;
const LINE_SEARCH_ALPHAS = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125];
const ARMIJO_C1 = 0.01;

function addVec(a: Vector, b: Vector): Vector {
  return a.map((v, i) => v + b[i]);
}
function subVec(a: Vector, b: Vector): Vector {
  return a.map((v, i) => v - b[i]);
}
function scaleVec(a: Vector, s: number): Vector {
  return a.map((v) => v * s);
}
function dot(a: Vector, b: Vector): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}
function quadForm(v: Vector, M: number[][]): number {
  return dot(v, matVec(M, v));
}

function clampControl(u: Vector): Vector {
  return [Math.min(Math.max(u[0], 0), T_MAX), Math.min(Math.max(u[1], -TAU_MAX), TAU_MAX)];
}

/** Cholesky-based positive-definiteness check, generic in matrix size (this demo's control
 * dimension is 2, but the check doesn't hardcode that). Returns false on the first non-positive
 * pivot, which is exactly the "Quu isn't invertible enough to trust" signal the backward pass
 * needs to decide whether to escalate regularization. */
function isPositiveDefinite(m: number[][]): boolean {
  const n = m.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = m[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      if (i === j) {
        if (sum <= 1e-12) return false;
        L[i][j] = Math.sqrt(sum);
      } else {
        L[i][j] = sum / L[j][j];
      }
    }
  }
  return true;
}

function symmetrize(m: number[][]): number[][] {
  return m.map((row, i) => row.map((v, j) => 0.5 * (v + m[j][i])));
}

interface Gains {
  K: number[][]; // feedback (2x6)
  d: Vector; // feedforward (2,)
}

interface BackwardPassResult {
  gains: Gains[]; // length N, index k = gains for stage k
  expectedLinear: number; // sum_k d_k^T Qu_k
  expectedQuadratic: number; // sum_k d_k^T Quu_k d_k
}

/** One DDP/iLQR backward pass along `nominal`, regularizing both Quu (the standard
 * Levenberg-Marquardt control regularization, needed to invert it for the gains) and Qxx (added
 * directly to the propagated value-function curvature, which meaningfully helps conditioning
 * given the ground penalty's kink and how far the weight sliders can push Q/R) -- see the plan's
 * solver section. Returns null if Quu stays non-positive-definite even after regularization,
 * signaling the caller to increase lambdaControl and retry. */
function backwardPass(
  nominal: NominalTrajectory,
  weights: CostWeights,
  dt: number,
  lambdaControl: number,
  lambdaState: number,
  params: RocketParams | undefined,
): BackwardPassResult | null {
  const N = nominal.controls.length;
  const nStates = nominal.states[0].length;
  const nControls = nominal.controls[0].length;

  const term = terminalCost(nominal.states[N], weights);
  let Vx = term.lx;
  let Vxx = term.lxx;

  const gains: Gains[] = new Array(N);
  let expectedLinear = 0;
  let expectedQuadratic = 0;

  for (let k = N - 1; k >= 0; k--) {
    const x = nominal.states[k];
    const u = nominal.controls[k];
    const { A, B } = linearizedStep(x, u, dt, params);
    const stage = stageCost(x, u, weights, N);

    const AT = transpose(A);
    const BT = transpose(B);
    const VxxA = matMul(Vxx, A);
    const VxxB = matMul(Vxx, B);

    const Qx = addVec(stage.lx, matVec(AT, Vx));
    const Qu = addVec(stage.lu, matVec(BT, Vx));
    const Qxx = addMat(stage.lxx, matMul(AT, VxxA));
    const Quu = addMat(stage.luu, matMul(BT, VxxB));
    const Qux = matMul(BT, VxxA); // (lux = 0, the cost is separable in x and u)

    const QuuReg = addMat(Quu, scaleMat(identity(nControls), lambdaControl));
    if (!isPositiveDefinite(QuuReg)) return null;

    const d = solveLinearVec(QuuReg, scaleVec(Qu, -1));
    const K = solveLinearSystem(QuuReg, scaleMat(Qux, -1));

    expectedLinear += dot(d, Qu);
    expectedQuadratic += quadForm(d, QuuReg);

    const KT = transpose(K);
    const QuxT = transpose(Qux);
    const QxxReg = addMat(Qxx, scaleMat(identity(nStates), lambdaState));

    Vx = addVec(Qx, addVec(matVec(KT, matVec(QuuReg, d)), addVec(matVec(KT, Qu), matVec(QuxT, d))));
    Vxx = symmetrize(addMat(QxxReg, addMat(matMul(KT, matMul(QuuReg, K)), addMat(matMul(KT, Qux), matMul(QuxT, K)))));

    gains[k] = { K, d };
  }

  return { gains, expectedLinear, expectedQuadratic };
}

function rolloutCost(traj: NominalTrajectory, weights: CostWeights): number {
  const N = traj.controls.length;
  let total = 0;
  for (let k = 0; k < N; k++) {
    total += stageCost(traj.states[k], traj.controls[k], weights, N).value;
  }
  total += terminalCost(traj.states[N], weights).value;
  return total;
}

/** Rolls the true nonlinear dynamics forward from x0 under a given control sequence -- used both
 * to re-anchor a warm-started guess to the actual current state, and inside the forward pass's
 * line search. */
export function rolloutFrom(x0: Vector, controls: Vector[], dt: number, params?: RocketParams): NominalTrajectory {
  const states: Vector[] = [x0];
  for (const u of controls) {
    const xNext = rk4Step((_t, xi) => rocketDynamics(xi, u, params), 0, states[states.length - 1], dt);
    states.push(xNext);
  }
  return { states, controls };
}

/** A natural cold-start guess: hold hover thrust and zero torque for the whole horizon. Used
 * whenever there's no previous solve to warm-start from (first tick, or after a hard reset). */
export function coldStartTrajectory(
  x0: Vector,
  horizonSteps: number,
  dt: number,
  params?: RocketParams,
): NominalTrajectory {
  const controls = Array.from({ length: horizonSteps }, () => [hoverThrust(params), 0]);
  return rolloutFrom(x0, controls, dt, params);
}

interface ForwardPassResult {
  trajectory: NominalTrajectory;
  cost: number;
  accepted: boolean;
  alpha: number;
}

/** Forward pass with an Armijo backtracking line search (c1 = 0.01, i.e. accept the first
 * trial alpha -- almost always alpha=1 -- whose actual cost decrease is at least 1% of the
 * quadratic model's predicted decrease). Rolls out the *true* nonlinear dynamics at each trial
 * alpha, not the linearization. */
function forwardPass(
  nominal: NominalTrajectory,
  gains: Gains[],
  baseCost: number,
  expectedLinear: number,
  expectedQuadratic: number,
  weights: CostWeights,
  dt: number,
  params: RocketParams | undefined,
): ForwardPassResult {
  const N = nominal.controls.length;

  for (const alpha of LINE_SEARCH_ALPHAS) {
    const states: Vector[] = [nominal.states[0]];
    const controls: Vector[] = [];
    let finite = true;

    for (let k = 0; k < N; k++) {
      const dx = subVec(states[k], nominal.states[k]);
      const u = addVec(nominal.controls[k], addVec(scaleVec(gains[k].d, alpha), matVec(gains[k].K, dx)));
      const uClamped = clampControl(u);
      controls.push(uClamped);
      const xNext = rk4Step((_t, xi) => rocketDynamics(xi, uClamped, params), 0, states[k], dt);
      if (!xNext.every(Number.isFinite)) {
        finite = false;
        break;
      }
      states.push(xNext);
    }
    if (!finite) continue;

    const trajectory = { states, controls };
    const cost = rolloutCost(trajectory, weights);
    if (!Number.isFinite(cost)) continue;

    const predictedDecrease = -(alpha * expectedLinear + 0.5 * alpha * alpha * expectedQuadratic);
    const actualDecrease = baseCost - cost;
    if (actualDecrease >= ARMIJO_C1 * predictedDecrease) {
      return { trajectory, cost, accepted: true, alpha };
    }
  }

  return { trajectory: nominal, cost: baseCost, accepted: false, alpha: 0 };
}

/**
 * Solves the finite-horizon nonlinear MPC problem from x0 via receding-horizon iLQR, warm-started
 * from `initialGuess.controls` (the caller is responsible for shifting a previous solution --
 * see ../control/rtiSim.ts). Regularization (lambdaControl on Quu, lambdaState on Qxx) escalates
 * on backward-pass or line-search failure and relaxes on success, so the same solve() works both
 * for a cheap 1-2 iteration real-time-iteration tick and a fuller from-scratch convergence.
 */
export function solve(x0: Vector, initialGuess: NominalTrajectory, options: SolveOptions): SolveResult {
  const { dt, weights, params, maxIterations, costTolerance } = options;

  let nominal = rolloutFrom(x0, initialGuess.controls, dt, params);
  let cost = rolloutCost(nominal, weights);

  let lambdaControl = INITIAL_LAMBDA;
  let lambdaState = INITIAL_LAMBDA;
  let converged = false;
  let iterations = 0;
  const costHistory: number[] = [cost];

  for (; iterations < maxIterations; iterations++) {
    let backward = backwardPass(nominal, weights, dt, lambdaControl, lambdaState, params);
    let escalations = 0;
    while (backward === null && escalations < MAX_REGULARIZATION_ESCALATIONS) {
      lambdaControl = Math.min(lambdaControl * LAMBDA_FACTOR, LAMBDA_MAX);
      lambdaState = Math.min(lambdaState * LAMBDA_FACTOR, LAMBDA_MAX);
      backward = backwardPass(nominal, weights, dt, lambdaControl, lambdaState, params);
      escalations++;
    }
    if (backward === null) break;

    const forward = forwardPass(
      nominal,
      backward.gains,
      cost,
      backward.expectedLinear,
      backward.expectedQuadratic,
      weights,
      dt,
      params,
    );

    if (forward.accepted) {
      const improvement = cost - forward.cost;
      nominal = forward.trajectory;
      cost = forward.cost;
      costHistory.push(cost);
      lambdaControl = Math.max(lambdaControl / LAMBDA_FACTOR, LAMBDA_MIN);
      lambdaState = Math.max(lambdaState / LAMBDA_FACTOR, LAMBDA_MIN);
      if (improvement < costTolerance * Math.max(1, Math.abs(cost))) {
        converged = true;
        iterations++;
        break;
      }
    } else {
      lambdaControl = Math.min(lambdaControl * LAMBDA_FACTOR, LAMBDA_MAX);
      lambdaState = Math.min(lambdaState * LAMBDA_FACTOR, LAMBDA_MAX);
      if (lambdaControl >= LAMBDA_MAX) break;
    }
  }

  return { trajectory: nominal, cost, iterations, converged, costHistory };
}
