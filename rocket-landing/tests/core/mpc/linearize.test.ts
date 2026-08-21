import { describe, expect, it } from 'vitest';
import { linearizedStep } from '../../../src/core/mpc/linearize.ts';
import { rocketDynamics } from '../../../src/core/dynamics/rocket.ts';
import { rk4Step } from '../../../src/core/sim/rk4.ts';
import { fdJacobian } from '../fdJacobian.ts';

describe('linearizedStep', () => {
  const dt = 0.05;
  const points: Array<{ x: number[]; u: number[] }> = [
    { x: [10, 40, 0, 2, -3, 0.1], u: [15000, 500] },
    { x: [-5, 20, 0.4, -1, 1, -0.2], u: [5000, -1000] },
    { x: [0, 5, -0.6, 0, -8, 0], u: [8000, -2000] },
  ];

  const discreteStep = (x: number[], u: number[]) => rk4Step((_t, xi) => rocketDynamics(xi, u), 0, x, dt);

  for (const [i, { x, u }] of points.entries()) {
    it(`matches xNext from a plain rk4Step at test point ${i}`, () => {
      const { xNext } = linearizedStep(x, u, dt);
      const expected = discreteStep(x, u);
      for (let k = 0; k < 6; k++) {
        expect(xNext[k]).toBeCloseTo(expected[k], 10);
      }
    });

    it(`matches a finite-difference Jacobian of the whole RK4 step at test point ${i}`, () => {
      const { A, B } = linearizedStep(x, u, dt);
      const fdA = fdJacobian((xi) => discreteStep(xi, u), x);
      const fdB = fdJacobian((ui) => discreteStep(x, ui), u);

      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          expect(A[row][col]).toBeCloseTo(fdA[row][col], 5);
        }
        for (let col = 0; col < 2; col++) {
          expect(B[row][col]).toBeCloseTo(fdB[row][col], 5);
        }
      }
    });
  }
});
