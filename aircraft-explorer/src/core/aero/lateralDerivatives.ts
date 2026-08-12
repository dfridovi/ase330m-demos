import type { LateralCoefficients, PhysicalParams } from '../types/aircraft.ts';
import { wingSpan } from '../types/aircraft.ts';
import { airDensity } from './atmosphere.ts';

/**
 * Dimensional lateral-directional stability & control derivatives, before the Ixz
 * roll-yaw-inertia-coupling correction (see lateralStateSpace.ts). Formulas follow the
 * standard small-perturbation dimensionalization (Etkin/Nelson): dynamic pressure
 * Q = 1/2 rho U0^2, force derivatives normalized by mass, moment derivatives left as RAW
 * torques (not yet divided by Ixx/Izz) — the Ixz correction needs the raw torques, not
 * per-axis-normalized ones (see lateralStateSpace.ts for why).
 */
export interface LateralDimensionalDerivatives {
  Ybeta: number; // 1/s
  Yp: number; // m/s per rad/s
  Yr: number; // m/s per rad/s
  Ydeltaa: number; // m/s^2 per rad aileron
  Ydeltar: number; // m/s^2 per rad rudder
  Lbeta: number; // N*m per rad, raw (not divided by Ixx)
  Lp: number; // N*m per rad/s, raw
  Lr: number; // N*m per rad/s, raw
  Ldeltaa: number; // N*m per rad aileron, raw
  Ldeltar: number; // N*m per rad rudder, raw
  Nbeta: number; // N*m per rad, raw (not divided by Izz)
  Np: number; // N*m per rad/s, raw
  Nr: number; // N*m per rad/s, raw
  Ndeltaa: number; // N*m per rad aileron, raw
  Ndeltar: number; // N*m per rad rudder, raw
  dynamicPressure: number; // Pa
  wingSpan: number; // m
}

export function computeLateralDimensionalDerivatives(
  params: PhysicalParams,
  coeffs: LateralCoefficients,
): LateralDimensionalDerivatives {
  const { mass, wingArea: S, trimSpeed: U0, altitude } = params;
  const b = wingSpan(params);
  const rho = airDensity(altitude);
  const Q = 0.5 * rho * U0 * U0;

  const Ybeta = (coeffs.CYbeta * Q * S) / mass;
  const Yp = (coeffs.CYp * Q * S * b) / (2 * mass * U0);
  const Yr = (coeffs.CYr * Q * S * b) / (2 * mass * U0);
  const Ydeltaa = (coeffs.CYdeltaa * Q * S) / mass;
  const Ydeltar = (coeffs.CYdeltar * Q * S) / mass;

  const Lbeta = coeffs.Clbeta * Q * S * b;
  const Lp = (coeffs.Clp * Q * S * b * b) / (2 * U0);
  const Lr = (coeffs.Clr * Q * S * b * b) / (2 * U0);
  const Ldeltaa = coeffs.Cldeltaa * Q * S * b;
  const Ldeltar = coeffs.Cldeltar * Q * S * b;

  const Nbeta = coeffs.Cnbeta * Q * S * b;
  const Np = (coeffs.Cnp * Q * S * b * b) / (2 * U0);
  const Nr = (coeffs.Cnr * Q * S * b * b) / (2 * U0);
  const Ndeltaa = coeffs.Cndeltaa * Q * S * b;
  const Ndeltar = coeffs.Cndeltar * Q * S * b;

  return {
    Ybeta,
    Yp,
    Yr,
    Ydeltaa,
    Ydeltar,
    Lbeta,
    Lp,
    Lr,
    Ldeltaa,
    Ldeltar,
    Nbeta,
    Np,
    Nr,
    Ndeltaa,
    Ndeltar,
    dynamicPressure: Q,
    wingSpan: b,
  };
}
