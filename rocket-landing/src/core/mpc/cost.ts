import type { Vector } from '../sim/rk4.ts';
import type { CostWeights } from '../constants.ts';
import { GROUND_PENALTY_WEIGHT, PAD_X, PAD_Y, THETA_APPROACH_BOOST, THETA_APPROACH_HEIGHT } from '../constants.ts';

export interface QuadraticCost {
  value: number;
  lx: Vector; // dL/dx (6,)
  lu: Vector; // dL/du (2,), all-zero for the terminal cost
  lxx: number[][]; // d2L/dx2 (6x6)
  luu: number[][]; // d2L/du2 (2x2), all-zero for the terminal cost
}

// A single soft-relu-squared barrier keeping the *predicted* horizon from diving below the pad --
// see the plan's "cost shaping instead of a hard constraint" note. Smooth except for a small kink
// at py = PAD_Y, which regularized iLQR tolerates fine in practice.
function groundPenalty(py: number): { value: number; d1: number; d2: number } {
  const violation = PAD_Y - py;
  if (violation <= 0) {
    return { value: 0, d1: 0, d2: 0 };
  }
  return {
    value: GROUND_PENALTY_WEIGHT * violation * violation,
    d1: -2 * GROUND_PENALTY_WEIGHT * violation, // d/dpy
    d2: 2 * GROUND_PENALTY_WEIGHT, // d2/dpy2
  };
}

// The attitude weight ramps up as the predicted trajectory nears the pad (mult -> 1+BOOST at
// py=0, decaying back to the plain qTheta weight by py=THETA_APPROACH_HEIGHT) -- without this, a
// tight touchdown-angle tolerance either needs a global qTheta so large it recreates the
// "hovers just above the pad forever" equilibrium (see DEFAULT_WEIGHTS' doc comment) or isn't
// reachable at all, since a flat qTheta trades off against position/velocity cost everywhere,
// not just at the moment that actually matters (touchdown). Piecewise-linear proximity (with the
// same kind of small kink as groundPenalty) keeps the gradient/Hessian closed-form.
function thetaApproachMultiplier(py: number): { mult: number; d1: number; d2: number } {
  const proximity = Math.min(1, Math.max(0, 1 - py / THETA_APPROACH_HEIGHT));
  const dProximity = py > 0 && py < THETA_APPROACH_HEIGHT ? -1 / THETA_APPROACH_HEIGHT : 0;
  return {
    mult: 1 + THETA_APPROACH_BOOST * proximity * proximity,
    d1: 2 * THETA_APPROACH_BOOST * proximity * dProximity, // d(mult)/dpy
    d2: 2 * THETA_APPROACH_BOOST * dProximity * dProximity, // d2(mult)/dpy2
  };
}

/** Running-cost weighting is scaled by 1/N so the sum over the horizon stays commensurate with
 * the (unscaled) terminal cost regardless of horizon length -- see the plan's cost section. */
export function stageCost(x: Vector, u: Vector, weights: CostWeights, horizonSteps: number): QuadraticCost {
  const [px, py, theta, vx, vy, omega] = x;
  const [T, tau] = u;
  const { qPos, qTheta, qVel, rThrust, rTorque } = weights;
  const qOmega = weights.qOmega;
  const scale = 1 / horizonSteps;

  const dx = px - PAD_X;
  const dy = py - PAD_Y;
  const ground = groundPenalty(py);
  const approach = thetaApproachMultiplier(py);
  const effQTheta = qTheta * approach.mult;

  const value =
    scale *
    (0.5 * (qPos * (dx * dx + dy * dy) + effQTheta * theta * theta + qVel * (vx * vx + vy * vy) + qOmega * omega * omega) +
      0.5 * (rThrust * T * T + rTorque * tau * tau) +
      ground.value);

  const lx = [
    scale * qPos * dx,
    scale * (qPos * dy + ground.d1 + 0.5 * qTheta * approach.d1 * theta * theta),
    scale * effQTheta * theta,
    scale * qVel * vx,
    scale * qVel * vy,
    scale * qOmega * omega,
  ];
  const lu = [scale * rThrust * T, scale * rTorque * tau];

  const thetaPyCross = scale * qTheta * approach.d1 * theta;
  const lxx = [
    [scale * qPos, 0, 0, 0, 0, 0],
    [0, scale * (qPos + ground.d2 + 0.5 * qTheta * approach.d2 * theta * theta), thetaPyCross, 0, 0, 0],
    [0, thetaPyCross, scale * effQTheta, 0, 0, 0],
    [0, 0, 0, scale * qVel, 0, 0],
    [0, 0, 0, 0, scale * qVel, 0],
    [0, 0, 0, 0, 0, scale * qOmega],
  ];
  const luu = [
    [scale * rThrust, 0],
    [0, scale * rTorque],
  ];

  return { value, lx, lu, lxx, luu };
}

export function terminalCost(x: Vector, weights: CostWeights): QuadraticCost {
  const [px, py, theta, vx, vy, omega] = x;
  const { qPos, qTheta, qVel, qOmega, terminalScale } = weights;

  const dx = px - PAD_X;
  const dy = py - PAD_Y;

  const value =
    terminalScale *
    0.5 *
    (qPos * (dx * dx + dy * dy) + qTheta * theta * theta + qVel * (vx * vx + vy * vy) + qOmega * omega * omega);

  const lx = [
    terminalScale * qPos * dx,
    terminalScale * qPos * dy,
    terminalScale * qTheta * theta,
    terminalScale * qVel * vx,
    terminalScale * qVel * vy,
    terminalScale * qOmega * omega,
  ];

  const lxx = [
    [terminalScale * qPos, 0, 0, 0, 0, 0],
    [0, terminalScale * qPos, 0, 0, 0, 0],
    [0, 0, terminalScale * qTheta, 0, 0, 0],
    [0, 0, 0, terminalScale * qVel, 0, 0],
    [0, 0, 0, 0, terminalScale * qVel, 0],
    [0, 0, 0, 0, 0, terminalScale * qOmega],
  ];

  return { value, lx, lu: [0, 0], lxx, luu: [[0, 0], [0, 0]] };
}
