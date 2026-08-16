import { describe, expect, it } from 'vitest';
import {
  frequencyResponseSeries,
  resonantFrequency,
  steadyStateAmplitude,
  steadyStatePhase,
} from '../../../src/core/dynamics/frequencyResponse.ts';

const SAMPLES = [
  { m: 300, k: 20000, c: 1500, f0: 500 },
  { m: 150, k: 5000, c: 100, f0: 200 },
  { m: 600, k: 50000, c: 1700, f0: 1000 },
];

const OMEGAS = [0.5, 2, 5, 8.16, 15];

function centralDiffSecondDerivative(
  f: (t: number) => number,
  t: number,
  h: number,
): number {
  return (f(t + h) - 2 * f(t) + f(t - h)) / (h * h);
}

function centralDiffFirstDerivative(
  f: (t: number) => number,
  t: number,
  h: number,
): number {
  return (f(t + h) - f(t - h)) / (2 * h);
}

describe('steadyStateAmplitude / steadyStatePhase', () => {
  it('x_ss(t) = X(omega) sin(omega t - phi(omega)) satisfies m·ẍ + c·ẋ + k·x = f0 sin(omega t)', () => {
    const h = 1e-5;
    for (const params of SAMPLES) {
      const { m, k, c, f0 } = params;
      for (const omega of OMEGAS) {
        const X = steadyStateAmplitude(omega, params);
        const phi = steadyStatePhase(omega, params);
        const x = (t: number) => X * Math.sin(omega * t - phi);
        for (const t of [0.3, 1.1, 2.7]) {
          const xdd = centralDiffSecondDerivative(x, t, h);
          const xd = centralDiffFirstDerivative(x, t, h);
          const lhs = m * xdd + c * xd + k * x(t);
          const rhs = f0 * Math.sin(omega * t);
          expect(Math.abs(lhs - rhs)).toBeLessThan(1e-2 * f0);
        }
      }
    }
  });

  it('amplitude and phase reduce to the classical transfer function 1/(k - m*omega^2 + i*c*omega)', () => {
    for (const params of SAMPLES) {
      const { m, k, c, f0 } = params;
      for (const omega of OMEGAS) {
        const real = k - m * omega * omega;
        const imag = c * omega;
        const expectedMagnitude = f0 / Math.sqrt(real * real + imag * imag);
        const expectedPhase = Math.atan2(imag, real);
        expect(steadyStateAmplitude(omega, params)).toBeCloseTo(expectedMagnitude, 8);
        expect(steadyStatePhase(omega, params)).toBeCloseTo(expectedPhase, 8);
      }
    }
  });
});

describe('resonantFrequency', () => {
  it('is the frequency that (locally) maximizes steadyStateAmplitude, when it exists', () => {
    for (const params of SAMPLES) {
      const omegaR = resonantFrequency(params);
      expect(omegaR).not.toBeNull();
      const peak = steadyStateAmplitude(omegaR as number, params);
      const before = steadyStateAmplitude((omegaR as number) - 0.01, params);
      const after = steadyStateAmplitude((omegaR as number) + 0.01, params);
      expect(peak).toBeGreaterThan(before);
      expect(peak).toBeGreaterThan(after);
    }
  });

  it('matches the peak of a dense frequency sweep', () => {
    for (const params of SAMPLES) {
      const omegaR = resonantFrequency(params) as number;
      const series = frequencyResponseSeries(params, 0.1, 25, 5000);
      const numericPeak = series.reduce((best, p) => (p.magnitude > best.magnitude ? p : best));
      expect(numericPeak.omega).toBeCloseTo(omegaR, 1);
    }
  });

  it('returns null when damping is too heavy for a resonance peak to exist', () => {
    // Underdamped (k/m - sigma^2 > 0) but omegaD^2 - sigma^2 < 0: no interior peak.
    const params = { m: 150, k: 5000, c: 1650 };
    expect(resonantFrequency(params)).toBeNull();
  });
});
