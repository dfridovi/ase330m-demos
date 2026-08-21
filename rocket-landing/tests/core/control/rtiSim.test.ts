import { describe, expect, it } from 'vitest';
import { initialRtiState, step } from '../../../src/core/control/rtiSim.ts';
import { DEFAULT_FUEL, DEFAULT_WEIGHTS, DT, HORIZON_STEPS } from '../../../src/core/constants.ts';

const OPTIONS = {
  dt: DT,
  horizonSteps: HORIZON_STEPS,
  weights: DEFAULT_WEIGHTS,
  iterations: 10,
  costTolerance: 1e-6,
};

function runToRest(x0: number[], maxTicks: number) {
  let state = initialRtiState(x0, OPTIONS, DEFAULT_FUEL);
  const fuelHistory = [state.fuelRemaining];
  let ticks = 0;
  while (state.landingStatus === 'flying' && ticks < maxTicks) {
    const result = step(state, OPTIONS);
    state = result.next;
    fuelHistory.push(state.fuelRemaining);
    ticks++;
  }
  return { state, fuelHistory, ticks };
}

describe('rtiSim.step', () => {
  it('depletes fuel monotonically while flying and burning thrust', () => {
    const { fuelHistory } = runToRest([8, 40, 0, 0, -4, 0], 300);
    for (let i = 1; i < fuelHistory.length; i++) {
      expect(fuelHistory[i]).toBeLessThanOrEqual(fuelHistory[i - 1] + 1e-9);
    }
    expect(fuelHistory[fuelHistory.length - 1]).toBeLessThan(fuelHistory[0]);
  });

  it('lands safely from a mild offset within a bounded number of ticks', () => {
    const { state, ticks } = runToRest([8, 40, 0, 0, -4, 0], 300);
    expect(state.landingStatus).toBe('landed');
    expect(ticks).toBeLessThan(300);
  });

  // A large enough disturbance (here: well outside the pad, tilted, and already falling fast)
  // can legitimately be unrecoverable given finite actuator limits -- this is expected behavior
  // for a real vehicle, not a bug (see the plan's note that pushing weights or a disturbance too
  // far should visibly crash, not silently "always land"). This test only checks the sim reaches
  // a resolved outcome (not stuck flying forever, no NaN/divergence), not that it always lands.
  it('resolves to a finite landed-or-crashed outcome from a large offset, without diverging', () => {
    const { state, ticks } = runToRest([-10, 50, -0.1, -1, -5, 0], 400);
    expect(['landed', 'crashed']).toContain(state.landingStatus);
    expect(ticks).toBeLessThan(400);
    for (const v of state.realState) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it('never lets fuel go negative', () => {
    const { fuelHistory } = runToRest([8, 40, 0, 0, -4, 0], 300);
    for (const fuel of fuelHistory) {
      expect(fuel).toBeGreaterThanOrEqual(0);
    }
  });

  it('crashes from running out of fuel mid-air, independent of how it was flying', () => {
    const x0 = [8, 40, 0, 0, -4, 0];
    // Same scenario lands comfortably with the default fuel budget (see above)...
    let state = initialRtiState(x0, OPTIONS, DEFAULT_FUEL);
    let ticks = 0;
    while (state.landingStatus === 'flying' && ticks < 300) {
      state = step(state, OPTIONS).next;
      ticks++;
    }
    expect(state.landingStatus).toBe('landed');

    // ...but flames out mid-air on a fuel budget far too small to reach the ground.
    let starved = initialRtiState(x0, OPTIONS, 0.5);
    ticks = 0;
    while (starved.landingStatus === 'flying' && ticks < 300) {
      starved = step(starved, OPTIONS).next;
      ticks++;
    }
    expect(starved.landingStatus).toBe('crashed');
    expect(starved.fuelRemaining).toBe(0);
    expect(starved.realState[1]).toBeGreaterThan(0); // still airborne when it flamed out
  });
});
