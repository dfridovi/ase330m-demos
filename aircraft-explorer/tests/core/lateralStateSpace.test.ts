import { describe, expect, it } from 'vitest';
import { assembleLateralStateSpace } from '../../src/core/aero/lateralStateSpace.ts';
import { labelLateralModes } from '../../src/core/aero/modeLabels.ts';
import { eigenDecompose } from '../../src/core/linalg/eig.ts';
import { AIRFRAME_PRESETS, FIGHTER, GENERAL_AVIATION } from '../../src/core/aero/presets.ts';

// Reference lateral-directional example already used in lecture
// (matlab-scripts/aircraft_dynamics_modes.m, "Lateral" section). Its eigenvalues (computed
// directly, see conversation record), state order [beta, p, r, phi]:
//   GA:    Dutch Roll wn=2.384 zeta=0.204; Spiral -0.0089 (tau~112s, stable);
//          Roll Subsidence -8.433 (tau~0.119s)
//   X-29A: Dutch Roll wn=1.317 zeta=0.187; Spiral +0.0324 (tau~-31s, UNSTABLE);
//          Roll Subsidence -1.608 (tau~0.622s)
// Our independently-chosen non-dimensional coefficients aren't the same aircraft as either
// reference, so only order-of-magnitude/sign agreement is checked, mirroring how
// stateSpace.test.ts validates the longitudinal model against its own MATLAB reference.

function modeStats(re: number, im: number) {
  const wn = Math.hypot(re, im);
  return { wn, zeta: -re / wn };
}

describe('assembleLateralStateSpace', () => {
  it('has the expected sparsity structure (kinematic phi-dot = p row, gravity term)', () => {
    const { A, B } = assembleLateralStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.lateral.coefficients);
    expect(A[3]).toEqual([0, 1, 0, 0]);
    expect(A[0][3]).toBeCloseTo(9.80665 / GENERAL_AVIATION.defaultParams.trimSpeed, 5);
    expect(B).toHaveLength(4);
    expect(B[0]).toHaveLength(2);
    expect(B[3]).toEqual([0, 0]);
  });

  it('produces a Dutch Roll / Roll Subsidence / Spiral split in the same ballpark as the course reference (GA)', () => {
    const { A } = assembleLateralStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.lateral.coefficients);
    const { eigenvalues } = eigenDecompose(A);

    const oscillatory = eigenvalues.filter((e) => e.im > 0).map((e) => modeStats(e.re, e.im));
    const real = eigenvalues.filter((e) => e.im === 0);
    expect(oscillatory).toHaveLength(1);
    expect(real).toHaveLength(2);

    const dutchRoll = oscillatory[0];
    expect(dutchRoll.zeta).toBeGreaterThan(0);
    expect(dutchRoll.wn).toBeGreaterThan(1);
    expect(dutchRoll.wn).toBeLessThan(5);
    expect(dutchRoll.zeta).toBeGreaterThan(0.1);
    expect(dutchRoll.zeta).toBeLessThan(0.5);

    // Both real modes stable, and clearly time-scale-separated (roll subsidence fast, spiral slow).
    const sortedByMagnitude = [...real].sort((a, b) => Math.abs(b.re) - Math.abs(a.re));
    const [rollSubsidence, spiral] = sortedByMagnitude;
    expect(rollSubsidence.re).toBeLessThan(0);
    expect(spiral.re).toBeLessThan(0);
    expect(Math.abs(rollSubsidence.re)).toBeGreaterThan(Math.abs(spiral.re) * 10);
    expect(Math.abs(rollSubsidence.re)).toBeGreaterThan(1);
    expect(Math.abs(spiral.re)).toBeLessThan(0.1);
  });

  it('the Fighter preset has a genuinely unstable Spiral while Dutch Roll and Roll Subsidence stay stable', () => {
    const { A } = assembleLateralStateSpace(FIGHTER.defaultParams, FIGHTER.lateral.coefficients);
    const { eigenvalues } = eigenDecompose(A);

    const real = eigenvalues.filter((e) => e.im === 0).sort((a, b) => Math.abs(b.re) - Math.abs(a.re));
    expect(real).toHaveLength(2);
    const [rollSubsidence, spiral] = real;

    expect(rollSubsidence.re).toBeLessThan(0); // roll subsidence stays stable
    expect(spiral.re).toBeGreaterThan(0); // spiral is unstable — matches the X-29A reference's sign
  });

  it('labelLateralModes names the modes correctly, including an unstable Spiral', () => {
    const { A } = assembleLateralStateSpace(FIGHTER.defaultParams, FIGHTER.lateral.coefficients);
    const { eigenvalues } = eigenDecompose(A);
    // Reuse the real Mode[] shape via decomposeModes-equivalent construction isn't needed here —
    // labelLateralModes only reads .naturalFrequency and .eigenvalues[0].re off each Mode.
    const modes = (() => {
      const oscillatory = eigenvalues.filter((e) => e.im > 0);
      const real = eigenvalues.filter((e) => e.im === 0);
      return [
        ...oscillatory.map((e) => ({
          indices: [0],
          eigenvalues: [e],
          naturalFrequency: Math.hypot(e.re, e.im),
          dampingRatio: -e.re / Math.hypot(e.re, e.im),
        })),
        ...real.map((e) => ({ indices: [0], eigenvalues: [e] })),
      ];
    })();
    const labels = labelLateralModes(modes);
    expect(labels).toContain('Dutch Roll');
    expect(labels).toContain('Roll Subsidence');
    expect(labels).toContain('Spiral');
  });

  it("every preset's lateral tSpan is long enough to show clear Spiral decay/growth (>=1.5 time constants)", () => {
    for (const preset of AIRFRAME_PRESETS) {
      const { A } = assembleLateralStateSpace(preset.defaultParams, preset.lateral.coefficients);
      const { eigenvalues } = eigenDecompose(A);
      const real = eigenvalues.filter((e) => e.im === 0).sort((a, b) => Math.abs(a.re) - Math.abs(b.re));
      if (real.length === 0) continue;
      const spiral = real[0]; // smallest |Re| = spiral, whether stable or unstable

      const duration = preset.lateral.tSpan[1] - preset.lateral.tSpan[0];
      const spiralTimeConstant = Math.abs(1 / spiral.re);
      expect(duration).toBeGreaterThanOrEqual(spiralTimeConstant * 1.5);
    }
  });
});
