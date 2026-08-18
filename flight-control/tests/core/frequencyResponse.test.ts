import { describe, expect, it } from 'vitest';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import { GENERAL_AVIATION } from '../../src/core/aero/presets.ts';
import { simulateStateFeedback } from '../../src/core/control/closedLoopSim.ts';
import { sinusoidReference } from '../../src/core/control/referenceSignals.ts';
import { closedLoopFrequencyResponse } from '../../src/core/control/frequencyResponse.ts';
import type { Trajectory } from '../../src/core/sim/rk4.ts';

/** Trapezoidal-quadrature projection of a (assumed already steady-state) signal onto
 * sin(omega t) and cos(omega t) over [tStart, trajectory end], recovering the amplitude/phase
 * of the equivalent A*sin(omega t + phase) sinusoid — used to cross-check the closed-form
 * frequency response against an actual simulated time-domain response. */
function extractSinusoid(trajectory: Trajectory, stateIndex: number, omega: number, tStart: number) {
  const { t, x } = trajectory;
  let sinProjection = 0;
  let cosProjection = 0;
  for (let i = 0; i < t.length - 1; i++) {
    if (t[i] < tStart) continue;
    const dt = t[i + 1] - t[i];
    const mid = (t[i] + t[i + 1]) / 2;
    const value = (x[i][stateIndex] + x[i + 1][stateIndex]) / 2;
    sinProjection += value * Math.sin(omega * mid) * dt;
    cosProjection += value * Math.cos(omega * mid) * dt;
  }
  const window = t[t.length - 1] - tStart;
  const aSin = (2 * sinProjection) / window;
  const aCos = (2 * cosProjection) / window;
  return { amplitude: Math.hypot(aSin, aCos), phase: Math.atan2(aCos, aSin) };
}

describe('closedLoopFrequencyResponse', () => {
  it('matches the steady-state amplitude/phase of an actual simulated sinusoidal reference', () => {
    const stateSpace = assembleLongitudinalStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.coefficients);
    const K = [0, 0, -5, -2]; // stabilizing (see closedLoopSim.test.ts), slowest pole ~16.6s time constant
    const omega = 0.3;
    const refAmplitude = 0.05;
    const thetaIndex = 3;

    const { trajectory, diverged } = simulateStateFeedback(
      stateSpace,
      K,
      [0, 0, 0, 0],
      sinusoidReference('theta', refAmplitude, omega),
      [0, 300],
      0.02,
    );
    expect(diverged).toBe(false);

    // Transient (dominant pole time constant ~16.6s) has decayed by >6 time constants; average
    // over the remaining ~9.5 periods (period = 2*pi/0.3 ~ 20.9s) to reject quadrature noise.
    const simulated = extractSinusoid(trajectory, thetaIndex, omega, 100);

    const [expected] = closedLoopFrequencyResponse(stateSpace, K, thetaIndex, thetaIndex, [omega]);
    const expectedAmplitude = expected.magnitude * refAmplitude;

    expect(simulated.amplitude).toBeCloseTo(expectedAmplitude, 2);
    expect(simulated.phase).toBeCloseTo(expected.phase, 1);
  });
});
