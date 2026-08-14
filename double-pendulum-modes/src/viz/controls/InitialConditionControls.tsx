import { usePendulumStore } from '../../store/pendulumStore.ts';
import { Slider } from './Slider.tsx';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function InitialConditionControls() {
  const activePreset = usePendulumStore((s) => s.activePreset);
  const setPureModePreset = usePendulumStore((s) => s.setPureModePreset);
  const setMixedPreset = usePendulumStore((s) => s.setMixedPreset);
  const x0 = usePendulumStore((s) => s.x0);
  const setInitialCondition = usePendulumStore((s) => s.setInitialCondition);
  const [theta1, theta2, theta1dot, theta2dot] = x0;

  return (
    <fieldset>
      <legend>Initial condition</legend>
      <div className="preset-selector">
        <button
          type="button"
          className={activePreset === 'mode1' ? 'preset-button active' : 'preset-button'}
          onClick={() => setPureModePreset(0)}
        >
          Pure Mode 1 (in-phase)
        </button>
        <button
          type="button"
          className={activePreset === 'mode2' ? 'preset-button active' : 'preset-button'}
          onClick={() => setPureModePreset(1)}
        >
          Pure Mode 2 (anti-phase)
        </button>
        <button
          type="button"
          className={activePreset === 'mixed' ? 'preset-button active' : 'preset-button'}
          onClick={() => setMixedPreset()}
        >
          Mixed (Mode 1 + Mode 2)
        </button>
      </div>

      <Slider
        label="Initial θ1"
        unit="deg"
        value={theta1 * RAD_TO_DEG}
        min={-45}
        max={45}
        step={0.5}
        onChange={(v) => setInitialCondition([v * DEG_TO_RAD, theta2, theta1dot, theta2dot])}
      />
      <Slider
        label="Initial θ2"
        unit="deg"
        value={theta2 * RAD_TO_DEG}
        min={-45}
        max={45}
        step={0.5}
        onChange={(v) => setInitialCondition([theta1, v * DEG_TO_RAD, theta1dot, theta2dot])}
      />
      <Slider
        label="Initial θ1dot"
        unit="deg/s"
        value={theta1dot * RAD_TO_DEG}
        min={-60}
        max={60}
        step={1}
        onChange={(v) => setInitialCondition([theta1, theta2, v * DEG_TO_RAD, theta2dot])}
      />
      <Slider
        label="Initial θ2dot"
        unit="deg/s"
        value={theta2dot * RAD_TO_DEG}
        min={-60}
        max={60}
        step={1}
        onChange={(v) => setInitialCondition([theta1, theta2, theta1dot, v * DEG_TO_RAD])}
      />
      <p className="input-hint">
        Presets set a "clean" initial condition that excites only one mode (or an equal mix of both) — drag any
        slider afterward to see how an arbitrary release angle still decomposes into the same two modes.
      </p>
    </fieldset>
  );
}
