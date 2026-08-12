import { AIRFRAME_PRESETS } from '../../core/aero/presets.ts';
import { useSimulationStore } from '../../store/simulationStore.ts';

export function PresetSelector() {
  const presetId = useSimulationStore((s) => s.presetId);
  const setPreset = useSimulationStore((s) => s.setPreset);

  return (
    <div className="preset-selector">
      {AIRFRAME_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={preset.id === presetId ? 'preset-button active' : 'preset-button'}
          onClick={() => setPreset(preset.id)}
          title={preset.description}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
