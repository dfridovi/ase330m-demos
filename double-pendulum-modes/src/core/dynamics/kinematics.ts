export interface BobPositions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Nonlinear forward kinematics (not the linearized model) for drawing the two bobs, so the
 * animation still looks like a physical pendulum even at angles where the linearization
 * itself is no longer accurate. Origin is the fixed pivot; y increases upward.
 */
export function bobPositions(theta1: number, theta2: number, l1: number, l2: number): BobPositions {
  const x1 = l1 * Math.sin(theta1);
  const y1 = -l1 * Math.cos(theta1);
  const x2 = x1 + l2 * Math.sin(theta2);
  const y2 = y1 - l2 * Math.cos(theta2);
  return { x1, y1, x2, y2 };
}
