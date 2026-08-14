import { describe, expect, it } from 'vitest';
import { assembleStateSpace } from '../../src/core/dynamics/stateSpace.ts';
import { integrate } from '../../src/core/sim/rk4.ts';
import { linearizedEnergy } from '../../src/core/dynamics/energy.ts';

const PARAMS = { m1: 1.3, m2: 0.7, l1: 1.1, l2: 0.6, g: 9.81 };

describe('linearizedEnergy', () => {
  it('is zero at rest at the hanging equilibrium', () => {
    const e = linearizedEnergy(PARAMS, 0, 0, 0, 0);
    expect(e.kinetic).toBe(0);
    expect(e.potential).toBe(0);
    expect(e.total).toBe(0);
  });

  it('is positive for any nonzero displacement or velocity', () => {
    expect(linearizedEnergy(PARAMS, 0.1, 0, 0, 0).total).toBeGreaterThan(0);
    expect(linearizedEnergy(PARAMS, 0, 0, 0.1, 0).total).toBeGreaterThan(0);
  });

  it('stays nearly constant along the continuous-time free response (RK4 drift is small)', () => {
    const { A } = assembleStateSpace(PARAMS);
    const x0 = [0.2, -0.1, 0, 0];
    const derivative = (_t: number, x: number[]) => [
      x[2],
      x[3],
      A[2][0] * x[0] + A[2][1] * x[1],
      A[3][0] * x[0] + A[3][1] * x[1],
    ];
    const { x } = integrate(derivative, x0, 0, 20, 0.01);
    const totals = x.map(([t1, t2, t1d, t2d]) => linearizedEnergy(PARAMS, t1, t2, t1d, t2d).total);
    const initial = totals[0];
    const maxDrift = Math.max(...totals.map((e) => Math.abs(e - initial)));
    expect(maxDrift / initial).toBeLessThan(0.01);
  });
});
