import { describe, expect, it } from 'vitest';
import { DEFAULT_ROCKET_PARAMS, hoverThrust, rocketDynamics, rocketJacobians } from '../../../src/core/dynamics/rocket.ts';
import { fdJacobian } from '../fdJacobian.ts';

describe('rocketDynamics', () => {
  it('is at equilibrium when upright and hovering', () => {
    const x = [0, 50, 0, 0, 0, 0];
    const u = [hoverThrust(), 0];
    const xdot = rocketDynamics(x, u);
    for (const v of xdot) {
      expect(v).toBeCloseTo(0, 10);
    }
  });

  it('accelerates upward and free-falls under gravity with no thrust', () => {
    const xdot = rocketDynamics([0, 50, 0, 0, 0, 0], [0, 0]);
    expect(xdot[4]).toBeCloseTo(-DEFAULT_ROCKET_PARAMS.g, 10);
    expect(xdot[3]).toBeCloseTo(0, 10);
  });

  it('is antisymmetric under theta -> -theta (mirrors the horizontal thrust component)', () => {
    const u = [15000, 0];
    const plus = rocketDynamics([0, 50, 0.3, 0, 0, 0], u);
    const minus = rocketDynamics([0, 50, -0.3, 0, 0, 0], u);
    expect(plus[3]).toBeCloseTo(-minus[3], 10);
    expect(plus[4]).toBeCloseTo(minus[4], 10);
  });

  it('torque only affects angular acceleration', () => {
    const xdot = rocketDynamics([0, 50, 0.1, 1, -2, 0.5], [1000, 300]);
    expect(xdot[5]).toBeCloseTo(300 / DEFAULT_ROCKET_PARAMS.inertia, 10);
  });
});

describe('rocketJacobians', () => {
  const points: Array<{ x: number[]; u: number[] }> = [
    { x: [10, 40, 0, 2, -3, 0.1], u: [15000, 500] },
    { x: [-5, 20, 0.4, -1, 1, -0.2], u: [5000, -1000] },
    { x: [0, 5, -0.6, 0, -8, 0], u: [0, 0] },
  ];

  for (const [i, { x, u }] of points.entries()) {
    it(`matches a finite-difference Jacobian of rocketDynamics at test point ${i}`, () => {
      const { Fx, Fu } = rocketJacobians(x, u);
      const fdFx = fdJacobian((xi) => rocketDynamics(xi, u), x);
      const fdFu = fdJacobian((ui) => rocketDynamics(x, ui), u);

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          expect(Fx[row][col]).toBeCloseTo(fdFx[row][col], 6);
        }
        for (let col = 0; col < 2; col++) {
          expect(Fu[row][col]).toBeCloseTo(fdFu[row][col], 6);
        }
      }
    });
  }
});
