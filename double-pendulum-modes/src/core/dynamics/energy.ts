import type { PhysicalParams } from '../types/pendulum.ts';

export interface Energy {
  kinetic: number;
  potential: number;
  total: number;
}

/**
 * Energy of the linearized model (same small-angle approximation as `assembleStateSpace`),
 * not the true nonlinear pendulum energy: KE from the small-angle mass matrix
 * M = [[(m1+m2)l1^2, m2 l1 l2], [m2 l1 l2, m2 l2^2]], PE from the harmonic (1-cos ~ theta^2/2)
 * expansion about the hanging equilibrium, K = diag((m1+m2) g l1, m2 g l2). This quadratic
 * form is exactly conserved by the continuous-time ODE xdot = Ax; any drift seen after RK4
 * integration is numerical error, not physics.
 */
export function linearizedEnergy(
  params: PhysicalParams,
  theta1: number,
  theta2: number,
  theta1dot: number,
  theta2dot: number,
): Energy {
  const { m1, m2, l1, l2, g } = params;
  const kinetic =
    0.5 * (m1 + m2) * l1 ** 2 * theta1dot ** 2 +
    m2 * l1 * l2 * theta1dot * theta2dot +
    0.5 * m2 * l2 ** 2 * theta2dot ** 2;
  const potential = 0.5 * (m1 + m2) * g * l1 * theta1 ** 2 + 0.5 * m2 * g * l2 * theta2 ** 2;
  return { kinetic, potential, total: kinetic + potential };
}
