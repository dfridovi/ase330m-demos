export interface CarParams {
  m: number;
  k: number;
  c: number;
}

export interface ModalParams {
  sigma: number;
  omegaD: number;
  isOverdamped: boolean;
}

export interface StateSpace {
  A: [[number, number], [number, number]];
  B: [number, number];
}

export interface SeriesPoint {
  t: number;
  x: number;
  xdot: number;
  // Applied force f(t) at this instant. Meaningful for periodic (f0*sin(omega*t)) and step
  // (constant f0) forcing; always 0 for impulse forcing, since a Dirac delta isn't a finite
  // value at any sampled t — the impulse magnitude I is shown separately as an instantaneous
  // marker rather than through this field.
  f: number;
}

export interface FrequencyPoint {
  omega: number;
  magnitude: number;
  phase: number;
}
