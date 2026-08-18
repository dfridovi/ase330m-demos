import type { LongitudinalCoefficients, PhysicalParams } from '../types/aircraft.ts';
import { airDensity } from './atmosphere.ts';

/**
 * Dimensional longitudinal stability & control derivatives, before the algebraic
 * substitution that folds Cm_alphadot into the pitch-rate equation (see stateSpace.ts).
 * Formulas follow the standard small-perturbation dimensionalization (Etkin/Nelson):
 * dynamic pressure Q = 1/2 rho U0^2, with derivatives normalized by mass or Iyy.
 */
export interface DimensionalDerivatives {
  Xu: number; // 1/s
  Xalpha: number; // m/s^2 (per rad)
  Zu: number; // 1/s
  Zalpha: number; // m/s^2 (per rad)
  Mu: number; // 1/(s m)
  Malpha: number; // 1/s^2
  Malphadot: number; // 1/s
  Mq: number; // 1/s
  Xdeltae: number; // m/s^2 (per rad elevator)
  Zdeltae: number; // m/s^2 (per rad elevator)
  Mdeltae: number; // 1/s^2
  dynamicPressure: number; // Pa
  effectiveCmalpha: number; // 1/rad, after CG-shift correction
}

/** CG shift by dh (aft-positive, fraction of chord) moves Cm_alpha by +CL_alpha * dh. */
export function effectiveCmalpha(coeffs: LongitudinalCoefficients, cgShiftFraction: number): number {
  return coeffs.Cmalpha + coeffs.CLalpha * cgShiftFraction;
}

export function computeDimensionalDerivatives(
  params: PhysicalParams,
  coeffs: LongitudinalCoefficients,
): DimensionalDerivatives {
  const { mass, Iyy, wingArea: S, meanChord: cbar, trimSpeed: U0, altitude, cgShiftFraction } = params;
  const rho = airDensity(altitude);
  const Q = 0.5 * rho * U0 * U0;
  const cmAlpha = effectiveCmalpha(coeffs, cgShiftFraction);

  const Xu = (-2 * coeffs.CD0 * Q * S) / (mass * U0);
  const Xalpha = ((coeffs.CL0 - coeffs.CDalpha) * Q * S) / mass;
  const Zu = (-2 * coeffs.CL0 * Q * S) / (mass * U0);
  const Zalpha = (-(coeffs.CLalpha + coeffs.CD0) * Q * S) / mass;

  const Mu = 0; // Cm_u ~ 0 under the incompressible-subsonic assumption used here.
  const Malpha = (cmAlpha * Q * S * cbar) / Iyy;
  const Malphadot = (coeffs.Cmalphadot * Q * S * cbar * cbar) / (2 * Iyy * U0);
  const Mq = (coeffs.Cmq * Q * S * cbar * cbar) / (2 * Iyy * U0);

  const Xdeltae = 0; // Elevator's direct axial-force contribution is neglected.
  const Zdeltae = (-coeffs.CLdeltae * Q * S) / mass;
  const Mdeltae = (coeffs.Cmdeltae * Q * S * cbar) / Iyy;

  return {
    Xu,
    Xalpha,
    Zu,
    Zalpha,
    Mu,
    Malpha,
    Malphadot,
    Mq,
    Xdeltae,
    Zdeltae,
    Mdeltae,
    dynamicPressure: Q,
    effectiveCmalpha: cmAlpha,
  };
}
