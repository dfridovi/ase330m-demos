import { useCwStore } from '../../store/cwStore';
import { PRESETS } from '../../core/dynamics/presets';
import { Slider } from './Slider';

const M_PER_KM = 1000;

export function InitialConditionControls() {
  const activePresetId = useCwStore((s) => s.activePresetId);
  const setPreset = useCwStore((s) => s.setPreset);
  const x0 = useCwStore((s) => s.x0);
  const setComponent = useCwStore((s) => s.setInitialConditionComponent);

  const activeDescription = PRESETS.find((p) => p.id === activePresetId)?.description;

  return (
    <fieldset>
      <legend>Initial condition</legend>
      <div className="preset-selector">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePresetId === preset.id ? 'preset-button active' : 'preset-button'}
            onClick={() => setPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {activeDescription && <p className="input-hint">{activeDescription}</p>}

      <Slider
        label="x0 (radial)"
        unit="km"
        value={x0.x / M_PER_KM}
        min={-5}
        max={5}
        step={0.05}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('x', v * M_PER_KM)}
      />
      <Slider
        label="y0 (along-track)"
        unit="km"
        value={x0.y / M_PER_KM}
        min={-5}
        max={5}
        step={0.05}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('y', v * M_PER_KM)}
      />
      <Slider
        label="z0 (cross-track)"
        unit="km"
        value={x0.z / M_PER_KM}
        min={-5}
        max={5}
        step={0.05}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('z', v * M_PER_KM)}
      />
      <Slider
        label="vx0 (radial rate)"
        unit="m/s"
        value={x0.vx}
        min={-2}
        max={2}
        step={0.01}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('vx', v)}
      />
      <Slider
        label="vy0 (along-track rate)"
        unit="m/s"
        value={x0.vy}
        min={-2}
        max={2}
        step={0.01}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('vy', v)}
      />
      <Slider
        label="vz0 (cross-track rate)"
        unit="m/s"
        value={x0.vz}
        min={-2}
        max={2}
        step={0.01}
        formatValue={(v) => v.toFixed(2)}
        onChange={(v) => setComponent('vz', v)}
      />
      <p className="input-hint">
        Presets set a "clean" initial condition (e.g. exactly cancelling the drift term) — drag any slider
        afterward to explore nearby conditions; the decomposition below still applies to whatever you release it
        from.
      </p>
    </fieldset>
  );
}
