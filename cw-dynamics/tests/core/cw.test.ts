import { describe, expect, it } from 'vitest';
import {
  decompose,
  meanMotion,
  noDriftVy0,
  orbitalPeriod,
  propagate,
  secularDriftRate,
  stateSpaceMatrix,
} from '../../src/core/dynamics/cw';
import type { RelativeState } from '../../src/core/types/orbit';

const n = meanMotion(400); // ISS-like altitude, n ~ 1.13e-3 rad/s

function accelerationFromState(state0: RelativeState, t: number, h = 1e-3) {
  // Central-difference second derivative of propagate(), to check the closed form
  // actually satisfies the CW ODEs (not just algebraically matches a formula).
  const plus = propagate(state0, n, t + h);
  const mid = propagate(state0, n, t);
  const minus = propagate(state0, n, t - h);
  return {
    ax: (plus.x - 2 * mid.x + minus.x) / (h * h),
    ay: (plus.y - 2 * mid.y + minus.y) / (h * h),
    az: (plus.z - 2 * mid.z + minus.z) / (h * h),
  };
}

describe('meanMotion / orbitalPeriod', () => {
  it('matches the ISS-altitude mean motion used in the course MATLAB scripts', () => {
    expect(n).toBeCloseTo(0.00113, 4);
  });

  it('orbital period is 2*pi/n', () => {
    expect(orbitalPeriod(n)).toBeCloseTo((2 * Math.PI) / n, 10);
  });
});

describe('propagate', () => {
  const state0: RelativeState = { x: 1000, y: -500, z: 200, vx: 0.1, vy: -0.2, vz: 0.05 };

  it('returns the initial condition at t=0', () => {
    const s = propagate(state0, n, 0);
    expect(s.x).toBeCloseTo(state0.x, 6);
    expect(s.y).toBeCloseTo(state0.y, 6);
    expect(s.z).toBeCloseTo(state0.z, 6);
    expect(s.vx).toBeCloseTo(state0.vx, 6);
    expect(s.vy).toBeCloseTo(state0.vy, 6);
    expect(s.vz).toBeCloseTo(state0.vz, 6);
  });

  it('satisfies the CW equations of motion at several times', () => {
    for (const t of [0, 137, 900, 4000]) {
      const { ax, ay, az } = accelerationFromState(state0, t);
      const s = propagate(state0, n, t);
      expect(ax).toBeCloseTo(2 * n * s.vy + 3 * n * n * s.x, 3);
      expect(ay).toBeCloseTo(-2 * n * s.vx, 3);
      expect(az).toBeCloseTo(-n * n * s.z, 3);
    }
  });

  it('is periodic with period 2*pi/n when vy0 = -2*n*x0 (no-drift condition)', () => {
    const period = orbitalPeriod(n);
    const closed: RelativeState = { x: 1000, y: 0, z: 300, vx: 0, vy: noDriftVy0(1000, n), vz: 0.1 };
    const s0 = propagate(closed, n, 0);
    const sT = propagate(closed, n, period);
    expect(sT.x).toBeCloseTo(s0.x, 4);
    expect(sT.y).toBeCloseTo(s0.y, 4);
    expect(sT.z).toBeCloseTo(s0.z, 4);
  });

  it('drifts along-track when the no-drift condition is not met', () => {
    const drifting: RelativeState = { x: 1000, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    const period = orbitalPeriod(n);
    const s0 = propagate(drifting, n, 0);
    const sT = propagate(drifting, n, period);
    expect(sT.y - s0.y).not.toBeCloseTo(0, 1);
    expect(sT.x).toBeCloseTo(s0.x, 4); // x always returns to itself each period
  });
});

describe('secularDriftRate / noDriftVy0', () => {
  it('is zero exactly when vy0 = -2*n*x0', () => {
    const x0 = 1500;
    const state0: RelativeState = { x: x0, y: 0, z: 0, vx: 0, vy: noDriftVy0(x0, n), vz: 0 };
    expect(secularDriftRate(state0, n)).toBeCloseTo(0, 10);
  });

  it('matches the observed along-track growth rate over many periods', () => {
    const state0: RelativeState = { x: 1000, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    const rate = secularDriftRate(state0, n);
    const t1 = 20 * orbitalPeriod(n);
    const t2 = 21 * orbitalPeriod(n);
    const y1 = propagate(state0, n, t1).y;
    const y2 = propagate(state0, n, t2).y;
    const observedRate = (y2 - y1) / (t2 - t1);
    expect(observedRate).toBeCloseTo(rate, 6);
  });
});

describe('decompose', () => {
  const state0: RelativeState = { x: 1000, y: -500, z: 200, vx: 0.1, vy: -0.2, vz: 0.05 };

  it('sums back exactly to the full propagated state at several times', () => {
    for (const t of [0, 250, 3000, 12345]) {
      const { drift, inPlane, crossTrack } = decompose(state0, n, t);
      const full = propagate(state0, n, t);
      expect(drift.x + inPlane.x + crossTrack.x).toBeCloseTo(full.x, 6);
      expect(drift.y + inPlane.y + crossTrack.y).toBeCloseTo(full.y, 6);
      expect(drift.z + inPlane.z + crossTrack.z).toBeCloseTo(full.z, 6);
      expect(drift.vx + inPlane.vx + crossTrack.vx).toBeCloseTo(full.vx, 6);
      expect(drift.vy + inPlane.vy + crossTrack.vy).toBeCloseTo(full.vy, 6);
      expect(drift.vz + inPlane.vz + crossTrack.vz).toBeCloseTo(full.vz, 6);
    }
  });

  it('has a zero drift term when the no-drift condition holds', () => {
    const closed: RelativeState = { x: 1000, y: 0, z: 0, vx: 0, vy: noDriftVy0(1000, n), vz: 0 };
    const { drift } = decompose(closed, n, 777);
    expect(drift.x).toBeCloseTo(0, 6);
    expect(drift.vy).toBeCloseTo(0, 6);
  });

  it('crossTrack is fully decoupled from the in-plane initial condition', () => {
    const state0: RelativeState = { x: 1000, y: -500, z: 0, vx: 0.1, vy: -0.2, vz: 0 };
    const { crossTrack } = decompose(state0, n, 5000);
    expect(crossTrack.z).toBeCloseTo(0, 10);
    expect(crossTrack.vz).toBeCloseTo(0, 10);
  });
});

describe('stateSpaceMatrix', () => {
  it('matches the course MATLAB A matrix structure', () => {
    const A = stateSpaceMatrix(n);
    expect(A[3][0]).toBeCloseTo(3 * n * n, 12);
    expect(A[3][4]).toBeCloseTo(2 * n, 12);
    expect(A[4][3]).toBeCloseTo(-2 * n, 12);
    expect(A[5][2]).toBeCloseTo(-n * n, 12);
  });
});
