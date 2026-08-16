import type { CarParams, FrequencyPoint } from '../types/params.ts';
import { getModalParams } from './quarterCar.ts';

// Steady-state response to f(t) = f0 sin(omega t): x_ss(t) = X(omega) sin(omega t - phi(omega)).
// Derived from the transfer function X(iω)/F(iω) = 1 / (k - m w^2 + i c w)
// (equivalently C(iwI - A)^-1 B with C = [1, 0]).
export function steadyStateAmplitude(
  omega: number,
  params: CarParams & { f0: number },
): number {
  const { m, k, c, f0 } = params;
  const real = k - m * omega * omega;
  const imag = c * omega;
  return f0 / Math.sqrt(real * real + imag * imag);
}

export function steadyStatePhase(omega: number, params: CarParams): number {
  const { m, k, c } = params;
  const real = k - m * omega * omega;
  const imag = c * omega;
  return Math.atan2(imag, real);
}

export function frequencyResponseSeries(
  params: CarParams & { f0: number },
  omegaMin: number,
  omegaMax: number,
  n: number,
): FrequencyPoint[] {
  const points: FrequencyPoint[] = [];
  for (let i = 0; i < n; i++) {
    const omega = omegaMin + ((omegaMax - omegaMin) * i) / (n - 1);
    points.push({
      omega,
      magnitude: steadyStateAmplitude(omega, params),
      phase: steadyStatePhase(omega, params),
    });
  }
  return points;
}

// The forcing frequency that maximizes the steady-state amplitude X(omega). Minimizing
// the denominator (k - m*omega^2)^2 + (c*omega)^2 over u = omega^2 gives
// u* = omegaD^2 - sigma^2 (using sigma^2 + omegaD^2 = k/m) — an interior peak only exists
// when the damping is light enough that omegaD^2 > sigma^2; otherwise |X(omega)| decreases
// monotonically from its omega=0 value and there is no resonance.
export function resonantFrequency(params: CarParams): number | null {
  const { sigma, omegaD } = getModalParams(params);
  const discriminant = omegaD * omegaD - sigma * sigma;
  if (discriminant <= 0) return null;
  return Math.sqrt(discriminant);
}
