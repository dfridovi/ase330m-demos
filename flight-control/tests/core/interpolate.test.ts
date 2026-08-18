import { describe, expect, it } from 'vitest';
import { sampleTrajectory } from '../../src/core/sim/interpolate.ts';

describe('sampleTrajectory', () => {
  const trajectory = { t: [0, 1, 2, 3], x: [[0], [10], [20], [30]] };

  it('returns exact samples at grid points', () => {
    expect(sampleTrajectory(trajectory, 2)).toEqual([20]);
  });

  it('linearly interpolates between grid points', () => {
    expect(sampleTrajectory(trajectory, 1.5)[0]).toBeCloseTo(15, 9);
  });

  it('clamps outside the trajectory span', () => {
    expect(sampleTrajectory(trajectory, -5)).toEqual([0]);
    expect(sampleTrajectory(trajectory, 50)).toEqual([30]);
  });
});
