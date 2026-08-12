import { describe, expect, it } from 'vitest';
import { assembleLongitudinalStateSpace } from '../../src/core/aero/stateSpace.ts';
import { decomposeModes, simulateModes } from '../../src/core/sim/modalDecomposition.ts';
import { labelLongitudinalModes } from '../../src/core/aero/modeLabels.ts';
import { AIRFRAME_PRESETS } from '../../src/core/aero/presets.ts';

// Regression guard for a real bug: the modal decomposition chart used to default to alpha,
// where the phugoid is nearly invisible next to the short-period spike (alpha and q are the
// short period's own states — the phugoid barely touches them by construction). Each preset
// now names a `defaultChartStateIndex` chosen so the phugoid is genuinely comparable in size
// to the short period there, not dwarfed. This test catches any future preset/coefficient
// change that quietly breaks that pairing.
describe("preset defaultChartStateIndex shows a visible phugoid", () => {
  it('the phugoid mode is not dwarfed by the short-period mode in the chosen default state', () => {
    for (const preset of AIRFRAME_PRESETS) {
      const stateSpace = assembleLongitudinalStateSpace(preset.defaultParams, preset.coefficients);
      const { modes } = decomposeModes(stateSpace.A, preset.defaultX0);
      const labels = labelLongitudinalModes(modes);
      const shortPeriodIdx = labels.indexOf('Short Period');
      const phugoidIdx = labels.indexOf('Phugoid');

      // Presets like "GA -- Aft CG (Pitch Unstable)" can have no oscillatory short-period/phugoid
      // pair at all (real roots instead) — nothing to compare in that case.
      if (shortPeriodIdx < 0 || phugoidIdx < 0) continue;

      const dt = (preset.tSpan[1] - preset.tSpan[0]) / 3000;
      const { modeResponses } = simulateModes(stateSpace, preset.defaultX0, preset.tSpan, dt);
      const peakInState = (modeIdx: number) =>
        modeResponses[modeIdx].x.reduce((max, row) => Math.max(max, Math.abs(row[preset.defaultChartStateIndex])), 0);

      const shortPeriodPeak = peakInState(shortPeriodIdx);
      const phugoidPeak = peakInState(phugoidIdx);

      expect(phugoidPeak).toBeGreaterThan(shortPeriodPeak * 0.5);
    }
  });
});
