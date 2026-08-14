import type { StateSpace } from '../types/stateSpace.ts';
import type { PhysicalParams } from '../types/pendulum.ts';

/**
 * Linearizes a double pendulum (two point masses m1, m2 on massless rods l1, l2) about its
 * hanging equilibrium (theta1 = theta2 = 0). State x = [theta1, theta2, theta1dot, theta2dot].
 *
 * Small-angle Lagrangian mechanics gives M*theta'' + K*theta = 0 with
 *   M = [ (m1+m2)l1   m2 l2 ]      K = [ (m1+m2)g   0 ]
 *       [    l1         l2  ]          [    0        g ]
 * so theta'' = -M^-1 K theta. With m1=m2=l1=l2=g=1 this reduces to the fixed matrix
 * [[-2, 1], [2, -2]] used in the course's matlab-scripts/double_pendulum.m.
 */
export function assembleStateSpace(params: PhysicalParams): StateSpace {
  const { m1, m2, l1, l2, g } = params;

  const M = [
    [(m1 + m2) * l1, m2 * l2],
    [l1, l2],
  ];
  const K = [
    [(m1 + m2) * g, 0],
    [0, g],
  ];

  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const Minv = [
    [M[1][1] / det, -M[0][1] / det],
    [-M[1][0] / det, M[0][0] / det],
  ];

  // angularAccel = -Minv * K
  const angularAccel = [
    [-(Minv[0][0] * K[0][0] + Minv[0][1] * K[1][0]), -(Minv[0][0] * K[0][1] + Minv[0][1] * K[1][1])],
    [-(Minv[1][0] * K[0][0] + Minv[1][1] * K[1][0]), -(Minv[1][0] * K[0][1] + Minv[1][1] * K[1][1])],
  ];

  const A = [
    [0, 0, 1, 0],
    [0, 0, 0, 1],
    [angularAccel[0][0], angularAccel[0][1], 0, 0],
    [angularAccel[1][0], angularAccel[1][1], 0, 0],
  ];

  return {
    A,
    B: [[0], [0], [0], [0]], // no forced input — this demo only covers the free response
    C: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
    ],
    D: [[0], [0]],
    stateLabels: ['θ1', 'θ2', 'θ1dot', 'θ2dot'],
    inputLabels: [],
    outputLabels: ['θ1', 'θ2'],
  };
}
