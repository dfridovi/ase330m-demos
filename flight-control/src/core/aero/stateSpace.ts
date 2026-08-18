import type { LongitudinalCoefficients, PhysicalParams } from '../types/aircraft.ts';
import type { StateSpace } from '../types/stateSpace.ts';
import { GRAVITY } from './atmosphere.ts';
import { computeDimensionalDerivatives } from './derivatives.ts';

/**
 * Longitudinal small-perturbation state space, state x = [du, alpha, q, theta], input u = [delta_e].
 * The pitch-rate equation's Cm_alphadot * alpha_dot term is folded in by substituting the
 * alpha_dot equation, which is the standard textbook treatment (Nelson, Etkin).
 */
export function assembleLongitudinalStateSpace(
  params: PhysicalParams,
  coeffs: LongitudinalCoefficients,
): StateSpace {
  const U0 = params.trimSpeed;
  const d = computeDimensionalDerivatives(params, coeffs);

  const ZuHat = d.Zu / U0;
  const ZalphaHat = d.Zalpha / U0;
  const ZdeltaeHat = d.Zdeltae / U0;

  const MuPrime = d.Mu + d.Malphadot * ZuHat;
  const MalphaPrime = d.Malpha + d.Malphadot * ZalphaHat;
  const MqPrime = d.Mq + d.Malphadot;
  const MdeltaePrime = d.Mdeltae + d.Malphadot * ZdeltaeHat;

  const A = [
    [d.Xu, d.Xalpha, 0, -GRAVITY],
    [ZuHat, ZalphaHat, 1, 0],
    [MuPrime, MalphaPrime, MqPrime, 0],
    [0, 0, 1, 0],
  ];

  const B = [[d.Xdeltae], [ZdeltaeHat], [MdeltaePrime], [0]];

  const C = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  const D = [[0], [0], [0], [0]];

  return {
    A,
    B,
    C,
    D,
    stateLabels: ['du (m/s)', 'alpha (rad)', 'q (rad/s)', 'theta (rad)'],
    inputLabels: ['delta_e (rad)'],
    outputLabels: ['du (m/s)', 'alpha (rad)', 'q (rad/s)', 'theta (rad)'],
  };
}
