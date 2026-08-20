import { describe, expect, it } from 'vitest';
import { distanceSeries, timeToCapture } from '../../src/core/control/metrics.ts';

describe('distanceSeries', () => {
  it('is the Euclidean norm of the position components only', () => {
    const trajectory = { t: [0], x: [[3, 4, 0, 99, 99, 99]] };
    expect(distanceSeries(trajectory)).toEqual([5]);
  });
});

describe('timeToCapture', () => {
  const times = [0, 1, 2, 3, 4];

  it('returns the time of the last sustained crossing below threshold', () => {
    const distances = [100, 50, 4, 6, 3]; // dips below at t=2, pops back out at t=3, settles at t=4
    expect(timeToCapture(times, distances, 5)).toBe(4);
  });

  it('returns null if it never sustains capture', () => {
    const distances = [100, 50, 4, 6, 20];
    expect(timeToCapture(times, distances, 5)).toBeNull();
  });

  it('returns the first time if already captured throughout', () => {
    const distances = [1, 1, 1, 1, 1];
    expect(timeToCapture(times, distances, 5)).toBe(0);
  });
});
