import { describe, expect, it } from 'vitest';
import { sisoZeros } from '../../src/core/linalg/zeros.ts';

// Shared 2-state plant: A = [[0,1],[-2,-3]] (poles at -1,-2), B = [[0],[1]].
// (sI-A)^-1 B = 1/((s+1)(s+2)) * [1; s], so G(s) = C * that.
const A2 = [
  [0, 1],
  [-2, -3],
];
const B2 = [[0], [1]];

describe('sisoZeros', () => {
  it('returns no finite zeros when the numerator is a nonzero constant', () => {
    // C = [1, 0] -> G(s) = 1/((s+1)(s+2)), numerator = 1 (degree 0).
    const zeros = sisoZeros(A2, B2, [[1, 0]]);
    expect(zeros).toHaveLength(0);
  });

  it('finds a single real zero at s=-1 for a hand-derivable numerator', () => {
    // C = [1, 1] -> G(s) = (1+s)/((s+1)(s+2)), numerator = s+1, zero at s=-1.
    const zeros = sisoZeros(A2, B2, [[1, 1]]);
    expect(zeros).toHaveLength(1);
    expect(zeros[0].re).toBeCloseTo(-1, 6);
    expect(zeros[0].im).toBeCloseTo(0, 6);
  });

  it('finds a zero at the origin for a 3-state controllable-canonical-form example', () => {
    // Controllable canonical form for (s+1)(s+2)(s+3) = s^3+6s^2+11s+6: x1'=x2, x2'=x3,
    // x3' = -6x1-11x2-6x3+u. Output y=x2=x1' -> G(s) = s / ((s+1)(s+2)(s+3)), zero at s=0.
    const A3 = [
      [0, 1, 0],
      [0, 0, 1],
      [-6, -11, -6],
    ];
    const B3 = [[0], [0], [1]];
    const zeros = sisoZeros(A3, B3, [[0, 1, 0]]);
    expect(zeros).toHaveLength(1);
    expect(zeros[0].re).toBeCloseTo(0, 6);
    expect(zeros[0].im).toBeCloseTo(0, 6);
  });
});
