import { describe, expect, it } from 'vitest';
import { decomposeModes, simulateModes } from '../../src/core/sim/modalDecomposition.ts';
import { assembleStateSpace } from '../../src/core/dynamics/stateSpace.ts';

const PARAMS = { m1: 1, m2: 1, l1: 1, l2: 1, g: 1 };

describe('decomposeModes (double pendulum)', () => {
  it('splits the 4-state system into two oscillatory modes summing to x0', () => {
    const { A } = assembleStateSpace(PARAMS);
    const x0 = [0.3, -0.2, 0, 0.05];
    const { modes, modeInitialConditions } = decomposeModes(A, x0);

    expect(modes).toHaveLength(2);
    expect(modes.every((m) => m.indices.length === 2)).toBe(true);
    expect(modes.every((m) => Math.abs(m.dampingRatio ?? NaN) < 1e-9)).toBe(true); // undamped, conservative system

    const summed = x0.map((_, i) => modeInitialConditions.reduce((sum, modeX0) => sum + modeX0[i], 0));
    for (let i = 0; i < x0.length; i++) {
      expect(summed[i]).toBeCloseTo(x0[i], 6);
    }
  });

  it('sums per-mode free responses back to the full free response at every sampled time step', () => {
    const stateSpace = assembleStateSpace(PARAMS);
    const x0 = [0.25, 0.1, 0, -0.05];
    const { fullResponse, modeResponses } = simulateModes(stateSpace, x0, [0, 20], 0.01);

    for (let step = 0; step < fullResponse.t.length; step += 200) {
      for (let stateIdx = 0; stateIdx < x0.length; stateIdx++) {
        const summed = modeResponses.reduce((sum, mode) => sum + mode.x[step][stateIdx], 0);
        expect(summed).toBeCloseTo(fullResponse.x[step][stateIdx], 3);
      }
    }
  });
});
