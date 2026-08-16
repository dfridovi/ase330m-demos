import { describe, expect, it } from 'vitest';
import {
  stepResponse,
  stepResponseSeries,
  stepResponseVelocity,
} from '../../../src/core/dynamics/stepResponse.ts';

const SAMPLES = [
  { m: 300, k: 20000, c: 1500, f0: 500 },
  { m: 150, k: 5000, c: 100, f0: 200 },
  { m: 600, k: 50000, c: 1700, f0: 1000 },
];

// Central-difference second derivative, same technique used to verify cw-dynamics'
// closed-form solution against its ODE.
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

describe('stepResponse', () => {
  it('satisfies m·ẍ + c·ẋ + k·x = f0 at sample times', () => {
    const h = 1e-4;
    for (const params of SAMPLES) {
      const { m, k, c, f0 } = params;
      const x = (t: number) => stepResponse(t, params);
      for (const t of [0.01, 0.05, 0.2, 0.5, 1.0]) {
        const xdd = centralDiffSecondDerivative(x, t, h);
        const xd = centralDiffFirstDerivative(x, t, h);
        const residual = m * xdd + c * xd + k * x(t) - f0;
        expect(Math.abs(residual)).toBeLessThan(1e-3 * f0);
      }
    }
  });

  it('starts at rest: x(0) = 0, xdot(0) = 0', () => {
    for (const params of SAMPLES) {
      expect(stepResponse(0, params)).toBeCloseTo(0, 8);
      expect(stepResponseVelocity(0, params)).toBeCloseTo(0, 8);
    }
  });

  it('settles to the static deflection f0/k as t grows (sigma < 0)', () => {
    for (const params of SAMPLES) {
      const settled = stepResponse(20, params);
      expect(settled).toBeCloseTo(params.f0 / params.k, 3);
    }
  });

  it('stepResponseVelocity matches a finite-difference derivative of stepResponse', () => {
    const h = 1e-5;
    for (const params of SAMPLES) {
      const x = (t: number) => stepResponse(t, params);
      for (const t of [0.02, 0.1, 0.3, 0.8]) {
        const numeric = centralDiffFirstDerivative(x, t, h);
        expect(stepResponseVelocity(t, params)).toBeCloseTo(numeric, 3);
      }
    }
  });

  it('stepResponseSeries records the constant applied force f0', () => {
    for (const params of SAMPLES) {
      const series = stepResponseSeries(params, 2, 50);
      for (const p of series) {
        expect(p.f).toBe(params.f0);
      }
    }
  });
});
