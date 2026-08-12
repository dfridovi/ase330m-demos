import { AIRFRAME_PRESETS, GENERAL_AVIATION } from '../../core/aero/presets.ts';
import { effectiveCmalpha } from '../../core/aero/derivatives.ts';
import { useSimulationStore } from '../../store/simulationStore.ts';
import { Slider } from './Slider.tsx';

function range(defaultValue: number, lowFactor: number, highFactor: number) {
  return { min: defaultValue * lowFactor, max: defaultValue * highFactor };
}

export function ParamSliders() {
  const presetId = useSimulationStore((s) => s.presetId);
  const params = useSimulationStore((s) => s.physicalParams);
  const setParam = useSimulationStore((s) => s.setPhysicalParam);
  const preset = AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION;
  const d = preset.defaultParams;

  return (
    <div className="param-sliders">
      <fieldset>
        <legend>Mass & inertia</legend>
        <Slider
          label="Mass"
          unit="kg"
          value={params.mass}
          {...range(d.mass, 0.4, 3)}
          step={d.mass * 0.01}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('mass', v)}
        />
        <Slider
          label="Pitch inertia (Iyy)"
          unit="kg·m²"
          value={params.Iyy}
          {...range(d.Iyy, 0.4, 3)}
          step={d.Iyy * 0.01}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('Iyy', v)}
        />
        <Slider
          label="Roll inertia (Ixx)"
          unit="kg·m²"
          value={params.Ixx}
          {...range(d.Ixx, 0.4, 3)}
          step={d.Ixx * 0.01}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('Ixx', v)}
        />
        <Slider
          label="Yaw inertia (Izz)"
          unit="kg·m²"
          value={params.Izz}
          {...range(d.Izz, 0.4, 3)}
          step={d.Izz * 0.01}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('Izz', v)}
        />
        <Slider
          label="Roll-yaw product of inertia (Ixz)"
          unit="kg·m²"
          value={params.Ixz}
          {...range(d.Ixz, 0.4, 3)}
          step={d.Ixz * 0.01}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('Ixz', v)}
        />
      </fieldset>

      <fieldset>
        <legend>Geometry</legend>
        <Slider
          label="Wing area (S)"
          unit="m²"
          value={params.wingArea}
          {...range(d.wingArea, 0.5, 2)}
          step={d.wingArea * 0.01}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('wingArea', v)}
        />
        <Slider
          label="Mean chord (c̄)"
          unit="m"
          value={params.meanChord}
          {...range(d.meanChord, 0.5, 2)}
          step={d.meanChord * 0.01}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => setParam('meanChord', v)}
        />
      </fieldset>

      <fieldset>
        <legend>CG position</legend>
        <Slider
          label="CG shift (+aft / −fwd)"
          unit="% chord"
          value={params.cgShiftFraction * 100}
          min={-10}
          max={10}
          step={0.5}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('cgShiftFraction', v / 100)}
        />
        <p className="input-hint">
          Cm_α = {effectiveCmalpha(preset.coefficients, params.cgShiftFraction).toFixed(3)} /rad — moving the CG aft
          shrinks the static margin (Cm_α → 0) and weakens pitch stiffness; moving it forward strengthens it.
        </p>
      </fieldset>

      <fieldset>
        <legend>Flight condition</legend>
        <Slider
          label="Trim airspeed (U0)"
          unit="m/s"
          value={params.trimSpeed}
          {...range(d.trimSpeed, 0.5, 2)}
          step={d.trimSpeed * 0.01}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('trimSpeed', v)}
        />
        <Slider
          label="Altitude"
          unit="m"
          value={params.altitude}
          min={0}
          max={11000}
          step={100}
          formatValue={(v) => v.toFixed(0)}
          onChange={(v) => setParam('altitude', v)}
        />
      </fieldset>
    </div>
  );
}
