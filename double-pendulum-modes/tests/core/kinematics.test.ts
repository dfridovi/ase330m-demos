import { describe, expect, it } from 'vitest';
import { bobPositions } from '../../src/core/dynamics/kinematics.ts';

describe('bobPositions', () => {
  it('hangs both bobs straight down at theta1=theta2=0', () => {
    const { x1, y1, x2, y2 } = bobPositions(0, 0, 1, 0.5);
    expect(x1).toBeCloseTo(0, 9);
    expect(y1).toBeCloseTo(-1, 9);
    expect(x2).toBeCloseTo(0, 9);
    expect(y2).toBeCloseTo(-1.5, 9);
  });

  it('swings the first bob to the side and carries the second bob with it', () => {
    const { x1, y1, x2, y2 } = bobPositions(Math.PI / 2, 0, 1, 1);
    expect(x1).toBeCloseTo(1, 9);
    expect(y1).toBeCloseTo(0, 9);
    // theta2 = 0 means the second rod hangs straight down *from the first bob's position*.
    expect(x2).toBeCloseTo(1, 9);
    expect(y2).toBeCloseTo(-1, 9);
  });
});
