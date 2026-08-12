import { describe, expect, it } from 'vitest';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import {
  AIRFRAME_PRESETS,
  FIGHTER,
  FIGHTER_HIGH_ALTITUDE,
  GENERAL_AVIATION,
  GENERAL_AVIATION_AFT_CG,
} from '../../src/core/aero/presets.ts';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';

// Reference longitudinal example already used in lecture
// (matlab_scripts/aircraft_dynamics_modes.m, commented "Longitudinal" block, U0 = 176 ft/s).
// Its eigenvalues (computed directly, see conversation record) are:
//   short period: -2.4895 +/- 2.5978i  -> wn = 3.599 rad/s, zeta = 0.692
//   phugoid:      -0.0170 +/- 0.2135i  -> wn = 0.214 rad/s, zeta = 0.080
// Eigenvalues of a state matrix are 1/time, so they compare directly across unit systems
// (only the underlying physical parameters need converting to SI) even though our model is
// assembled from independently-chosen non-dimensional coefficients, not the same aircraft.

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

    // Both modes must be stable and clearly separated in frequency (short period is the
    // fast, well-damped mode; phugoid is the slow, lightly-damped mode).
    expect(shortPeriod.zeta).toBeGreaterThan(0);
    expect(phugoid.zeta).toBeGreaterThan(0);
    expect(shortPeriod.wn).toBeGreaterThan(phugoid.wn * 5);

    // Ballpark match (order of magnitude, not exact) to the reference course example.
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

  it('the "Aft CG (Pitch Unstable)" preset is genuinely divergent (a positive real eigenvalue)', () => {
    const { A } = assembleLongitudinalStateSpace(
      GENERAL_AVIATION_AFT_CG.defaultParams,
      GENERAL_AVIATION_AFT_CG.coefficients,
    );
    const { eigenvalues } = eigenDecompose(A);
    expect(eigenvalues.some((e) => e.re > 0)).toBe(true);
  });

  it('the "Fighter — High Altitude" preset oscillates slower and with less damping than the Fighter baseline', () => {
    const baseline = assembleLongitudinalStateSpace(FIGHTER.defaultParams, FIGHTER.coefficients);
    const highAltitude = assembleLongitudinalStateSpace(
      FIGHTER_HIGH_ALTITUDE.defaultParams,
      FIGHTER_HIGH_ALTITUDE.coefficients,
    );
    const baselineModes = eigenDecompose(baseline.A)
      .eigenvalues.filter((e) => e.im > 0)
      .map((e) => modeStats(e.re, e.im))
      .sort((a, b) => b.wn - a.wn);
    const highAltitudeModes = eigenDecompose(highAltitude.A)
      .eigenvalues.filter((e) => e.im > 0)
      .map((e) => modeStats(e.re, e.im))
      .sort((a, b) => b.wn - a.wn);

    expect(baselineModes).toHaveLength(2);
    expect(highAltitudeModes).toHaveLength(2);
    const [baseShortPeriod, basePhugoid] = baselineModes;
    const [altShortPeriod, altPhugoid] = highAltitudeModes;

    // Thinner air -> lower dynamic pressure -> both modes get slower and less damped.
    expect(altShortPeriod.wn).toBeLessThan(baseShortPeriod.wn * 0.75);
    expect(altShortPeriod.zeta).toBeLessThan(baseShortPeriod.zeta);
    expect(altPhugoid.wn).toBeLessThan(basePhugoid.wn * 0.75);
    expect(altPhugoid.zeta).toBeLessThan(basePhugoid.zeta);

    // Still stable and still oscillatory, just softer.
    expect(altShortPeriod.zeta).toBeGreaterThan(0);
    expect(altPhugoid.zeta).toBeGreaterThan(0);
  });

  it("every preset's tSpan is long enough to show at least 1.5 phugoid cycles", () => {
    for (const preset of AIRFRAME_PRESETS) {
      const { A } = assembleLongitudinalStateSpace(preset.defaultParams, preset.coefficients);
      const oscillatory = eigenDecompose(A)
        .eigenvalues.filter((e) => e.im > 0)
        .map((e) => modeStats(e.re, e.im))
        .sort((a, b) => a.wn - b.wn);

      // Presets like "GA -- Aft CG (Pitch Unstable)" can have zero or one oscillatory pair (the
      // short-period pair collapses into real roots) — nothing to check in that case.
      if (oscillatory.length === 0) continue;
      const phugoid = oscillatory[0];

      const duration = preset.tSpan[1] - preset.tSpan[0];
      const phugoidPeriod = (2 * Math.PI) / phugoid.wn;
      expect(duration).toBeGreaterThanOrEqual(phugoidPeriod * 1.5);
    }
  });
});
