import { describe, expect, it } from 'vitest';
import { cumulativeEffort } from '../../src/core/control/closedLoopSim.ts';

describe('cumulativeEffort', () => {
  it('matches the closed form |u|^2 * T for a constant u', () => {
    const dt = 0.5;
    const T = 10;
    const times = Array.from({ length: T / dt + 1 }, (_, i) => i * dt);
    const u = times.map(() => [3, 4, 0]); // |u|^2 = 25
    const effort = cumulativeEffort(times, u);
    expect(effort[effort.length - 1]).toBeCloseTo(25 * T, 6);
  });

  it('is zero at t=0 and monotonically non-decreasing', () => {
    const times = [0, 1, 2, 3];
    const u = [
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [0, 0, 1],
    ];
    const effort = cumulativeEffort(times, u);
    expect(effort[0]).toBe(0);
    for (let i = 1; i < effort.length; i++) {
      expect(effort[i]).toBeGreaterThanOrEqual(effort[i - 1]);
    }
  });
});
