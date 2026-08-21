import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';
import { SCENARIO_PRESETS } from '../../core/dynamics/presets.ts';

export function ScenarioPresets() {
  const activePresetId = useRocketLandingStore((s) => s.activePresetId);
  const applyPreset = useRocketLandingStore((s) => s.applyPreset);

  const activeDescription = SCENARIO_PRESETS.find((p) => p.id === activePresetId)?.description;

  return (
    <fieldset>
      <legend>Scenario</legend>
      <div className="preset-selector">
        {SCENARIO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePresetId === preset.id ? 'preset-button active' : 'preset-button'}
            onClick={() => applyPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {activeDescription && <p className="input-hint">{activeDescription}</p>}
      {!activeDescription && (
        <p className="input-hint">Custom start -- drag the rocket or use the sliders below.</p>
      )}
    </fieldset>
  );
}
