import { describe, expect, it } from 'vitest';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import { GENERAL_AVIATION } from '../../src/core/aero/presets.ts';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

// Reference longitudinal example already used in lecture
// (matlab_scripts/aircraft_dynamics_modes.m, commented "Longitudinal" block, U0 = 176 ft/s).
// Its eigenvalues (computed directly) are:
//   short period: -2.4895 +/- 2.5978i  -> wn = 3.599 rad/s, zeta = 0.692
//   phugoid:      -0.0170 +/- 0.2135i  -> wn = 0.214 rad/s, zeta = 0.080

function modeStats(re: number, im: number) {
  const wn = Math.hypot(re, im);
  return { wn, zeta: -re / wn };
}

describe('assembleLongitudinalStateSpace', () => {
  it('has the expected sparsity structure (kinematic theta-dot = q row, gravity term)', () => {
    const { A, B } = assembleLongitudinalStateSpace(
      GENERAL_AVIATION.defaultParams,
      GENERAL_AVIATION.coefficients,
    );
    expect(A[3]).toEqual([0, 0, 1, 0]);
    expect(A[1][2]).toBe(1);
    expect(A[0][3]).toBeCloseTo(-9.80665, 5);
    expect(B[3][0]).toBe(0);
  });

  it('produces a short-period/phugoid mode split in the same ballpark as the course reference', () => {
    const { A } = assembleLongitudinalStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.coefficients);
    const { eigenvalues } = eigenDecompose(A);

    const oscillatory = eigenvalues.filter((e) => e.im > 0).map((e) => modeStats(e.re, e.im));
    expect(oscillatory).toHaveLength(2);
    oscillatory.sort((a, b) => b.wn - a.wn);
    const [shortPeriod, phugoid] = oscillatory;

    expect(shortPeriod.zeta).toBeGreaterThan(0);
    expect(phugoid.zeta).toBeGreaterThan(0);
    expect(shortPeriod.wn).toBeGreaterThan(phugoid.wn * 5);

    expect(shortPeriod.wn).toBeGreaterThan(1);
    expect(shortPeriod.wn).toBeLessThan(10);
    expect(shortPeriod.zeta).toBeGreaterThan(0.3);
    expect(shortPeriod.zeta).toBeLessThan(1);

    expect(phugoid.wn).toBeGreaterThan(0.05);
    expect(phugoid.wn).toBeLessThan(0.5);
    expect(phugoid.zeta).toBeGreaterThan(0);
    expect(phugoid.zeta).toBeLessThan(0.3);
  });

  it('moving the CG aft reduces static stability (Cm_alpha increases toward zero)', () => {
    const forward = assembleLongitudinalStateSpace(
      { ...GENERAL_AVIATION.defaultParams, cgShiftFraction: -0.05 },
      GENERAL_AVIATION.coefficients,
    );
    const aft = assembleLongitudinalStateSpace(
      { ...GENERAL_AVIATION.defaultParams, cgShiftFraction: 0.05 },
      GENERAL_AVIATION.coefficients,
    );
    const forwardEig = eigenDecompose(forward.A).eigenvalues.filter((e) => e.im > 0);
    const aftEig = eigenDecompose(aft.A).eigenvalues.filter((e) => e.im > 0);
    const forwardShortPeriodWn = Math.max(...forwardEig.map((e) => Math.hypot(e.re, e.im)));
    const aftShortPeriodWn = Math.max(...aftEig.map((e) => Math.hypot(e.re, e.im)));
    expect(forwardShortPeriodWn).toBeGreaterThan(aftShortPeriodWn);
  });
});
