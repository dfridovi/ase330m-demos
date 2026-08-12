import type { LateralCoefficients, PhysicalParams } from '../types/aircraft.ts';
import type { StateSpace } from '../types/stateSpace.ts';
import { GRAVITY } from './atmosphere.ts';
import { computeLateralDimensionalDerivatives } from './lateralDerivatives.ts';

/**
 * Lateral-directional small-perturbation state space, state x = [beta, p, r, phi], inputs
 * u = [delta_a, delta_r]. All 4 airframe presets trim wings-level (theta0 = 0), so
 * cos(theta0)=1 and tan(theta0)=0 throughout — there is no trim-pitch parameter to plumb.
 *
 * The roll/yaw equations are coupled through the product of inertia Ixz (Ixx*p_dot - Ixz*r_dot
 * = L, -Ixz*p_dot + Izz*r_dot = N); unlike the longitudinal Cm_alphadot term, this is a genuine
 * 2x2 linear solve, not a single substitution. Inverting:
 *   Gamma = Ixx*Izz - Ixz^2
 *   L'_x = (Izz*Lx + Ixz*Nx) / Gamma
 *   N'_x = (Ixx*Nx + Ixz*Lx) / Gamma
 * for x in {beta, p, r, deltaa, deltar}. This is the standard Etkin/Nelson "star" derivative
 * transform (Nelson's normalized-Gamma' convention is algebraically identical once expanded);
 * verified against the course's own MATLAB reference matrices (aircraft_dynamics_modes.m).
 */
export function assembleLateralStateSpace(params: PhysicalParams, coeffs: LateralCoefficients): StateSpace {
  const U0 = params.trimSpeed;
  const { Ixx, Izz, Ixz } = params;
  const d = computeLateralDimensionalDerivatives(params, coeffs);

  const Gamma = Ixx * Izz - Ixz * Ixz;
  const starL = (Lx: number, Nx: number) => (Izz * Lx + Ixz * Nx) / Gamma;
  const starN = (Lx: number, Nx: number) => (Ixx * Nx + Ixz * Lx) / Gamma;

  const LprimeBeta = starL(d.Lbeta, d.Nbeta);
  const LprimeP = starL(d.Lp, d.Np);
  const LprimeR = starL(d.Lr, d.Nr);
  const LprimeDeltaa = starL(d.Ldeltaa, d.Ndeltaa);
  const LprimeDeltar = starL(d.Ldeltar, d.Ndeltar);

  const NprimeBeta = starN(d.Lbeta, d.Nbeta);
  const NprimeP = starN(d.Lp, d.Np);
  const NprimeR = starN(d.Lr, d.Nr);
  const NprimeDeltaa = starN(d.Ldeltaa, d.Ndeltaa);
  const NprimeDeltar = starN(d.Ldeltar, d.Ndeltar);

  const YbetaHat = d.Ybeta / U0;
  const YpHat = d.Yp / U0;
  const YrHat = d.Yr / U0;
  const YdeltaaHat = d.Ydeltaa / U0;
  const YdeltarHat = d.Ydeltar / U0;

  const A = [
    [YbetaHat, YpHat, YrHat - 1, GRAVITY / U0],
    [LprimeBeta, LprimeP, LprimeR, 0],
    [NprimeBeta, NprimeP, NprimeR, 0],
    [0, 1, 0, 0],
  ];

  const B = [
    [YdeltaaHat, YdeltarHat],
    [LprimeDeltaa, LprimeDeltar],
    [NprimeDeltaa, NprimeDeltar],
    [0, 0],
  ];

  const C = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  const D = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  return {
    A,
    B,
    C,
    D,
    stateLabels: ['beta (rad)', 'p (rad/s)', 'r (rad/s)', 'phi (rad)'],
    inputLabels: ['delta_a (rad)', 'delta_r (rad)'],
    outputLabels: ['beta (rad)', 'p (rad/s)', 'r (rad/s)', 'phi (rad)'],
  };
}
