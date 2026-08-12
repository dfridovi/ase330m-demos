import { describe, expect, it } from 'vitest';
import { decomposeModes, simulateModes } from '../../src/core/sim/modalDecomposition.ts';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import { GENERAL_AVIATION } from '../../src/core/aero/presets.ts';

describe('decomposeModes', () => {
  it('splits a 4-state longitudinal system into two oscillatory modes summing to x0', () => {
    const { A } = assembleLongitudinalStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.coefficients);
    const x0 = [1, 0.05, 0, 0.02];
    const { modes, modeInitialConditions } = decomposeModes(A, x0);

    expect(modes).toHaveLength(2);
    expect(modes.every((m) => m.indices.length === 2)).toBe(true);

    const summed = x0.map((_, i) => modeInitialConditions.reduce((sum, modeX0) => sum + modeX0[i], 0));
    for (let i = 0; i < x0.length; i++) {
      expect(summed[i]).toBeCloseTo(x0[i], 6);
    }
  });

  it('sums per-mode free responses back to the full free response at every time step', () => {
    const stateSpace = assembleLongitudinalStateSpace(GENERAL_AVIATION.defaultParams, GENERAL_AVIATION.coefficients);
    const x0 = [2, 0.03, 0, -0.01];
    const { fullResponse, modeResponses } = simulateModes(stateSpace, x0, [0, 20], 0.01);

    for (let step = 0; step < fullResponse.t.length; step += 200) {
      for (let stateIdx = 0; stateIdx < x0.length; stateIdx++) {
        const summed = modeResponses.reduce((sum, mode) => sum + mode.x[step][stateIdx], 0);
        expect(summed).toBeCloseTo(fullResponse.x[step][stateIdx], 3);
      }
    }
  });
});
