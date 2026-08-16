import { describe, expect, it } from 'vitest';
import { getModalParams, getStateSpace } from '../../../src/core/dynamics/quarterCar.ts';

const SAMPLES = [
  { m: 300, k: 20000, c: 1500 },
  { m: 150, k: 5000, c: 100 },
  { m: 600, k: 50000, c: 1700 },
];

describe('getModalParams', () => {
  it('computes sigma = -c/(2m) and omegaD = sqrt(k/m - sigma^2)', () => {
    for (const params of SAMPLES) {
      const { sigma, omegaD, isOverdamped } = getModalParams(params);
      expect(sigma).toBeCloseTo(-params.c / (2 * params.m), 10);
      expect(omegaD).toBeCloseTo(
        Math.sqrt(params.k / params.m - sigma * sigma),
        10,
      );
      expect(isOverdamped).toBe(false);
    }
  });

  it('flags overdamped params (discriminant < 0)', () => {
    const { isOverdamped, omegaD } = getModalParams({ m: 150, k: 100, c: 1000 });
    expect(isOverdamped).toBe(true);
    expect(omegaD).toBe(0);
  });
});

describe('getStateSpace', () => {
  it('is consistent with getModalParams via trace/determinant of A', () => {
    for (const params of SAMPLES) {
      const { A } = getStateSpace(params);
      const { sigma, omegaD } = getModalParams(params);
      const trace = A[0][0] + A[1][1];
      const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      // Eigenvalues of A are sigma +/- j*omegaD, so trace = 2*sigma and det = sigma^2 + omegaD^2.
      expect(trace).toBeCloseTo(2 * sigma, 10);
      expect(det).toBeCloseTo(sigma * sigma + omegaD * omegaD, 10);
    }
  });

  it('builds A and B matching m·ẍ + c·ẋ + k·x = f(t) in first-order form', () => {
    for (const params of SAMPLES) {
      const { A, B } = getStateSpace(params);
      expect(A).toEqual([
        [0, 1],
        [-params.k / params.m, -params.c / params.m],
      ]);
      expect(B).toEqual([0, 1 / params.m]);
    }
  });
});
