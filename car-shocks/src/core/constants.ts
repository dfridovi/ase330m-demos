export const DEFAULT_PARAMS = {
  m: 300,
  k: 20000,
  c: 1500,
  omega: 6,
  f0: 500,
  I: 200,
};

export const SLIDER_RANGES = {
  m: { min: 150, max: 600, step: 10 },
  k: { min: 5000, max: 50000, step: 500 },
  // Capped so k/m - (c/2m)^2 > 0 (underdamped) across the entire m,k range: the
  // tightest corner is min(k)=5000, min(m)=150, which requires c < 2*sqrt(k*m) ≈ 1732.
  c: { min: 100, max: 1700, step: 25 },
  omega: { min: 0.5, max: 20, step: 0.1 },
  f0: { min: 100, max: 2000, step: 50 },
  I: { min: 20, max: 1000, step: 10 },
};

export const FREQ_SWEEP = { omegaMin: 0.1, omegaMax: 25, points: 400 };
