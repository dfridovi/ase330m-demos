import { describe, expect, it } from 'vitest';
import { assembleStateSpace } from '../../src/core/dynamics/stateSpace.ts';
import { decomposeModes } from '../../src/core/sim/modalDecomposition.ts';
import {
  modeShapeRatio,
  pureModeInitialCondition,
  sortModalResult,
  sortModesByFrequency,
} from '../../src/core/dynamics/modeShape.ts';

const PARAMS = { m1: 1, m2: 1, l1: 1, l2: 1, g: 1 };

describe('mode shapes (equal-mass, equal-length double pendulum)', () => {
  it('sorts modes ascending by natural frequency', () => {
    const { A } = assembleStateSpace(PARAMS);
    const { modes } = decomposeModes(A, [1, 0, 0, 0]);
    const sorted = sortModesByFrequency(modes);
    expect(sorted[0].naturalFrequency).toBeLessThan(sorted[1].naturalFrequency!);
  });

  it('labels the slow mode in-phase (positive shape ratio) and the fast mode anti-phase (negative)', () => {
    const { A } = assembleStateSpace(PARAMS);
    const { modes } = decomposeModes(A, [1, 0, 0, 0]);
    const [slow, fast] = sortModesByFrequency(modes);
    expect(modeShapeRatio(A, slow.indices[0])).toBeGreaterThan(0);
    expect(modeShapeRatio(A, fast.indices[0])).toBeLessThan(0);
  });

  it('matches the known equal-mass/equal-length eigenvalues (-2±sqrt(2) as omega^2)', () => {
    const { A } = assembleStateSpace(PARAMS);
    const { modes } = decomposeModes(A, [1, 0, 0, 0]);
    const [slow, fast] = sortModesByFrequency(modes);
    expect(slow.naturalFrequency).toBeCloseTo(Math.sqrt(2 - Math.sqrt(2)), 9);
    expect(fast.naturalFrequency).toBeCloseTo(Math.sqrt(2 + Math.sqrt(2)), 9);
  });

  it('pureModeInitialCondition produces an x0 that decomposes into only one mode', () => {
    const { A } = assembleStateSpace(PARAMS);
    const { modes } = decomposeModes(A, [1, 0, 0, 0]);
    const [slow] = sortModesByFrequency(modes);
    const x0 = pureModeInitialCondition(A, slow.indices[0], 0.3);

    const { modeInitialConditions } = decomposeModes(A, x0);
    // Exactly one mode's own IC should equal x0 (up to floating point); the other should be ~0.
    const norms = modeInitialConditions.map((v) => Math.hypot(...v));
    const nonZeroCount = norms.filter((n) => n > 1e-9).length;
    expect(nonZeroCount).toBe(1);
    expect(Math.abs(x0[0])).toBeCloseTo(0.3, 9);
  });

  it('sortModalResult keeps modes, initial conditions, and responses paired after reordering', () => {
    const stateSpace = assembleStateSpace(PARAMS);
    const x0 = [0.3, -0.2, 0, 0];
    const modal = {
      ...decomposeModes(stateSpace.A, x0),
      fullResponse: { t: [0], x: [x0] },
      modeResponses: decomposeModes(stateSpace.A, x0).modeInitialConditions.map((ic) => ({ t: [0], x: [ic] })),
    };
    const sorted = sortModalResult(modal);
    expect(sorted.modes[0].naturalFrequency).toBeLessThan(sorted.modes[1].naturalFrequency!);
    // Each mode's paired initial condition/response must still match the same mode after sorting.
    for (let i = 0; i < 2; i++) {
      expect(sorted.modeResponses[i].x[0]).toEqual(sorted.modeInitialConditions[i]);
    }
  });
});
