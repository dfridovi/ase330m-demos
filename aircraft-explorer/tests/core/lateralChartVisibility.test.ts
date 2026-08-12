import { describe, expect, it } from 'vitest';
import { assembleLateralStateSpace } from '../../src/core/aero/lateralStateSpace.ts';
import { decomposeModes, simulateModes } from '../../src/core/sim/modalDecomposition.ts';
import { labelLateralModes } from '../../src/core/aero/modeLabels.ts';
import { AIRFRAME_PRESETS } from '../../src/core/aero/presets.ts';

// Regression guard for a real bug (the lateral analogue of presetChartVisibility.test.ts's
// longitudinal one): the modal decomposition chart initially defaulted to phi for every
// lateral preset (phi is both the MATLAB course reference's own plotted variable and the
// state Roll Subsidence/Spiral are named for), but phi is dominated almost entirely by
// whichever real mode has the largest cumulative drift (usually Spiral) — Dutch Roll's peak
// amplitude there was ~18-80x smaller, effectively invisible. p (roll rate) is where all
// three modes land on a comparable scale instead. This test catches any future
// preset/coefficient change that quietly breaks that pairing.
describe("preset lateral.defaultChartStateIndex shows a visible Dutch Roll", () => {
  it('Dutch Roll is not dwarfed by Roll Subsidence or Spiral in the chosen default state', () => {
    for (const preset of AIRFRAME_PRESETS) {
      const stateSpace = assembleLateralStateSpace(preset.defaultParams, preset.lateral.coefficients);
      const { modes } = decomposeModes(stateSpace.A, preset.lateral.defaultX0);
      const labels = labelLateralModes(modes);
      const dutchRollIdx = labels.indexOf('Dutch Roll');
      const rollSubsidenceIdx = labels.indexOf('Roll Subsidence');
      const spiralIdx = labels.indexOf('Spiral');

      // Every current preset has all three lateral modes, but stay defensive in case a future
      // preset's lateral coefficients produce a different structure (e.g. two complex pairs).
      if (dutchRollIdx < 0) continue;

      const dt = (preset.lateral.tSpan[1] - preset.lateral.tSpan[0]) / 3000;
      const { modeResponses } = simulateModes(stateSpace, preset.lateral.defaultX0, preset.lateral.tSpan, dt);
      const peakInState = (modeIdx: number) =>
        modeResponses[modeIdx].x.reduce(
          (max, row) => Math.max(max, Math.abs(row[preset.lateral.defaultChartStateIndex])),
          0,
        );

      const dutchRollPeak = peakInState(dutchRollIdx);
      if (rollSubsidenceIdx >= 0) expect(dutchRollPeak).toBeGreaterThan(peakInState(rollSubsidenceIdx) * 0.5);
      if (spiralIdx >= 0) expect(dutchRollPeak).toBeGreaterThan(peakInState(spiralIdx) * 0.5);
    }
  });
});
