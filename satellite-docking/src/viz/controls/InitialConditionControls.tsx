import { useRendezvousStore } from '../../store/rendezvousStore';
import { INITIAL_CONDITION_PRESETS } from '../../core/dynamics/presets';
import { Slider } from './Slider';

export function InitialConditionControls() {
  const viewMode = useRendezvousStore((s) => s.viewMode);
  const activePresetId = useRendezvousStore((s) => s.activeInitialConditionPresetId);
  const setPreset = useRendezvousStore((s) => s.setInitialConditionPreset);
  const x0 = useRendezvousStore((s) => s.x0);
  const setComponent = useRendezvousStore((s) => s.setInitialConditionComponent);

  const activeDescription = INITIAL_CONDITION_PRESETS.find((p) => p.id === activePresetId)?.description;

  return (
    <fieldset>
      <legend>Initial condition</legend>
      <div className="preset-selector">
        {INITIAL_CONDITION_PRESETS.map((preset) => (
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

      <Slider label="x0 (radial)" unit="m" value={x0.x} min={-1000} max={1000} step={10} onChange={(v) => setComponent('x', v)} />
      <Slider
        label="y0 (along-track)"
        unit="m"
        value={x0.y}
        min={-1500}
        max={1500}
        step={10}
        onChange={(v) => setComponent('y', v)}
      />
      {viewMode === '3d' && (
        <Slider label="z0 (cross-track)" unit="m" value={x0.z} min={-500} max={500} step={10} onChange={(v) => setComponent('z', v)} />
      )}
      <Slider
        label="vx0 (radial rate)"
        unit="m/s"
        value={x0.vx}
        min={-1}
        max={1}
        step={0.01}
        onChange={(v) => setComponent('vx', v)}
      />
      <Slider
        label="vy0 (along-track rate)"
        unit="m/s"
        value={x0.vy}
        min={-1}
        max={1}
        step={0.01}
        onChange={(v) => setComponent('vy', v)}
      />
      {viewMode === '3d' && (
        <Slider
          label="vz0 (cross-track rate)"
          unit="m/s"
          value={x0.vz}
          min={-1}
          max={1}
          step={0.01}
          onChange={(v) => setComponent('vz', v)}
        />
      )}
    </fieldset>
  );
}
