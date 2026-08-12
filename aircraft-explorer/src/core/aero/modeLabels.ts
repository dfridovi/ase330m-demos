import type { Mode } from '../sim/modalDecomposition.ts';

/**
 * Labels longitudinal modes by convention: among the oscillatory (complex-pair) modes, the
 * higher-frequency one is the short period, the lower-frequency one is the phugoid. Any
 * other structure (e.g. a real eigenvalue, which can appear for unusual parameter choices)
 * falls back to a generic numbered label.
 */
export function labelLongitudinalModes(modes: Mode[]): string[] {
  const oscillatory = modes
    .map((mode, index) => ({ mode, index }))
    .filter((m) => m.mode.naturalFrequency !== undefined)
    .sort((a, b) => (b.mode.naturalFrequency ?? 0) - (a.mode.naturalFrequency ?? 0));

  const labels = new Array<string>(modes.length);
  oscillatory.forEach(({ index }, rank) => {
    labels[index] = rank === 0 ? 'Short Period' : rank === 1 ? 'Phugoid' : `Oscillatory Mode ${rank + 1}`;
  });
  modes.forEach((_mode, index) => {
    if (labels[index] === undefined) labels[index] = `Real Mode ${index + 1}`;
  });
  return labels;
}

/**
 * Labels lateral-directional modes by convention: the single complex-pair (oscillatory) mode
 * is Dutch Roll; among the real eigenvalues, the fastest (largest |Re|, heavily damped) is
 * Roll Subsidence and the slowest (smallest |Re|) is Spiral. Ranking by magnitude rather than
 * sign means the Spiral is labeled correctly even when it's unstable (a positive eigenvalue),
 * which happens for real aircraft with weak weathercock stability.
 */
export function labelLateralModes(modes: Mode[]): string[] {
  const labels = new Array<string>(modes.length);

  const oscillatory = modes
    .map((mode, index) => ({ mode, index }))
    .filter((m) => m.mode.naturalFrequency !== undefined);
  oscillatory.forEach(({ index }, rank) => {
    labels[index] = rank === 0 ? 'Dutch Roll' : `Oscillatory Mode ${rank + 1}`;
  });

  const real = modes
    .map((mode, index) => ({ mode, index }))
    .filter((m) => m.mode.naturalFrequency === undefined)
    .sort((a, b) => Math.abs(b.mode.eigenvalues[0].re) - Math.abs(a.mode.eigenvalues[0].re));
  real.forEach(({ index }, rank) => {
    labels[index] = rank === 0 ? 'Roll Subsidence' : rank === real.length - 1 ? 'Spiral' : `Real Mode ${index + 1}`;
  });

  return labels;
}
