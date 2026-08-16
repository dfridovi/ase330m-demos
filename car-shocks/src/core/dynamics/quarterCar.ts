import type { CarParams, ModalParams, StateSpace } from '../types/params.ts';

export function getStateSpace({ m, k, c }: CarParams): StateSpace {
  return {
    A: [
      [0, 1],
      [-k / m, -c / m],
    ],
    B: [0, 1 / m],
  };
}

export function getModalParams({ m, k, c }: CarParams): ModalParams {
  const sigma = -c / (2 * m);
  const discriminant = k / m - sigma * sigma;
  return {
    sigma,
    omegaD: Math.sqrt(Math.max(discriminant, 0)),
    isOverdamped: discriminant < 0,
  };
}
