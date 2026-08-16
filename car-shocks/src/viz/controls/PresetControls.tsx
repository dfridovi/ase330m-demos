import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { PRESETS } from '../../core/dynamics/presets.ts';

export function PresetControls() {
  const activePresetId = useCarShocksStore((s) => s.activePresetId);
  const applyPreset = useCarShocksStore((s) => s.applyPreset);

  const activeDescription = PRESETS.find((p) => p.id === activePresetId)?.description;

  return (
    <fieldset>
      <legend>Shocks preset</legend>
      <div className="preset-selector">
        {PRESETS.map((preset) => (
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
    </fieldset>
  );
}
