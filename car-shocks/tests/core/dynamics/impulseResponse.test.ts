import { describe, expect, it } from 'vitest';
import {
  impulseResponse,
  impulseResponseSeries,
  impulseResponseVelocity,
} from '../../../src/core/dynamics/impulseResponse.ts';
import { getModalParams } from '../../../src/core/dynamics/quarterCar.ts';

const SAMPLES = [
  { m: 300, k: 20000, c: 1500, I: 200 },
  { m: 150, k: 5000, c: 100, I: 80 },
  { m: 600, k: 50000, c: 1700, I: 400 },
];

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

describe('impulseResponse', () => {
  it('satisfies the homogeneous ODE m·ẍ + c·ẋ + k·x = 0 for t > 0', () => {
    const h = 1e-4;
    for (const params of SAMPLES) {
      const { m, k, c, I } = params;
      const x = (t: number) => impulseResponse(t, params);
      for (const t of [0.01, 0.05, 0.2, 0.5, 1.0]) {
        const xdd = centralDiffSecondDerivative(x, t, h);
        const xd = centralDiffFirstDerivative(x, t, h);
        const residual = m * xdd + c * xd + k * x(t);
        expect(Math.abs(residual)).toBeLessThan(1e-3 * I);
      }
    }
  });

  it('starts at x(0) = 0 with initial velocity I/m', () => {
    for (const params of SAMPLES) {
      expect(impulseResponse(0, params)).toBeCloseTo(0, 8);
      expect(impulseResponseVelocity(0, params)).toBeCloseTo(
        params.I / params.m,
        6,
      );
    }
  });

  it('impulseResponseVelocity matches a finite-difference derivative of impulseResponse', () => {
    const h = 1e-5;
    for (const params of SAMPLES) {
      const x = (t: number) => impulseResponse(t, params);
      for (const t of [0.02, 0.1, 0.3, 0.8]) {
        const numeric = centralDiffFirstDerivative(x, t, h);
        const analytic = impulseResponseVelocity(t, params);
        expect(Math.abs(analytic - numeric)).toBeLessThan(1e-3 * (params.I / params.m));
      }
    }
  });

  it('decays toward zero as t grows (sigma < 0)', () => {
    for (const params of SAMPLES) {
      const { sigma } = getModalParams(params);
      const t = 30 / Math.abs(sigma); // e^{sigma t} = e^-30, decayed regardless of sigma
      expect(Math.abs(impulseResponse(t, params))).toBeLessThan(1e-6);
    }
  });

  it('impulseResponseSeries leaves f at 0 (the impulse is instantaneous, not a sampleable value)', () => {
    for (const params of SAMPLES) {
      const series = impulseResponseSeries(params, 2, 50);
      for (const p of series) {
        expect(p.f).toBe(0);
      }
    }
  });
});
