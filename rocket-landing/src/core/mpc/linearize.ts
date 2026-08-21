import type { Vector } from '../sim/rk4.ts';
import { addMat, identity, matMul, scaleMat } from '../sim/matrix.ts';
import { rocketDynamics, rocketJacobians, type RocketParams } from '../dynamics/rocket.ts';

export interface DiscreteStep {
  xNext: Vector;
  A: number[][];
  B: number[][];
}

function scaleAdd(base: Vector, dir: Vector, scale: number): Vector {
  return base.map((v, i) => v + dir[i] * scale);
}

/**
 * One RK4 step of rocketDynamics, plus the *exact* discrete Jacobians (A = dxNext/dx0,
 * B = dxNext/du) of that step -- not a first-order Euler approximation.
 *
 * Derivation: RK4 composes k1..k4 = f evaluated at four points that each depend on x0 (and, for
 * k2..k4, on the previous k_i). Differentiating that composition with the chain rule, using the
 * continuous analytic Jacobians (Fx, Fu) at each of those same four points:
 *   dk1/dx0 = Fx(x0)
 *   dk2/dx0 = Fx(x0 + dt/2 k1) * (I + dt/2 dk1/dx0)
 *   dk3/dx0 = Fx(x0 + dt/2 k2) * (I + dt/2 dk2/dx0)
 *   dk4/dx0 = Fx(x0 + dt   k3) * (I + dt   dk3/dx0)
 * and similarly for du (product rule, since u also enters each Fx/Fu evaluation point through
 * the k_i's dependence on u):
 *   dk1/du = Fu(x0)
 *   dk2/du = Fx(x0 + dt/2 k1) * (dt/2 dk1/du) + Fu(x0 + dt/2 k1)
 *   dk3/du = Fx(x0 + dt/2 k2) * (dt/2 dk2/du) + Fu(x0 + dt/2 k2)
 *   dk4/du = Fx(x0 + dt   k3) * (dt   dk3/du) + Fu(x0 + dt   k3)
 * then A = I + dt/6 (dk1/dx0 + 2 dk2/dx0 + 2 dk3/dx0 + dk4/dx0), and B analogously with du.
 */
export function linearizedStep(x0: Vector, u: Vector, dt: number, params?: RocketParams): DiscreteStep {
  const n = x0.length;
  const I = identity(n);

  const k1 = rocketDynamics(x0, u, params);
  const { Fx: Fx1, Fu: Fu1 } = rocketJacobians(x0, u, params);
  const dk1dx = Fx1;
  const dk1du = Fu1;

  const p2 = scaleAdd(x0, k1, dt / 2);
  const k2 = rocketDynamics(p2, u, params);
  const { Fx: Fx2, Fu: Fu2 } = rocketJacobians(p2, u, params);
  const dk2dx = matMul(Fx2, addMat(I, scaleMat(dk1dx, dt / 2)));
  const dk2du = addMat(matMul(Fx2, scaleMat(dk1du, dt / 2)), Fu2);

  const p3 = scaleAdd(x0, k2, dt / 2);
  const k3 = rocketDynamics(p3, u, params);
  const { Fx: Fx3, Fu: Fu3 } = rocketJacobians(p3, u, params);
  const dk3dx = matMul(Fx3, addMat(I, scaleMat(dk2dx, dt / 2)));
  const dk3du = addMat(matMul(Fx3, scaleMat(dk2du, dt / 2)), Fu3);

  const p4 = scaleAdd(x0, k3, dt);
  const k4 = rocketDynamics(p4, u, params);
  const { Fx: Fx4, Fu: Fu4 } = rocketJacobians(p4, u, params);
  const dk4dx = matMul(Fx4, addMat(I, scaleMat(dk3dx, dt)));
  const dk4du = addMat(matMul(Fx4, scaleMat(dk3du, dt)), Fu4);

  const xNext = x0.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));

  const A = addMat(
    I,
    scaleMat(sumMat([dk1dx, scaleMat(dk2dx, 2), scaleMat(dk3dx, 2), dk4dx]), dt / 6),
  );
  const B = scaleMat(sumMat([dk1du, scaleMat(dk2du, 2), scaleMat(dk3du, 2), dk4du]), dt / 6);

  return { xNext, A, B };
}

function sumMat(mats: number[][][]): number[][] {
  return mats.reduce((acc, m) => addMat(acc, m));
}
