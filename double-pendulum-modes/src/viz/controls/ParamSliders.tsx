import { usePendulumStore } from '../../store/pendulumStore.ts';
import { Slider } from './Slider.tsx';

const GRAVITY_HINT = 'Moon 1.6 · Earth 9.81 · Jupiter 24.8 (m/s²)';

export function ParamSliders() {
  const params = usePendulumStore((s) => s.physicalParams);
  const setParam = usePendulumStore((s) => s.setPhysicalParam);

  return (
    <div className="param-sliders">
      <fieldset>
        <legend>Masses</legend>
        <Slider
          label="Bob 1 mass (m1)"
          unit="kg"
          value={params.m1}
          min={0.2}
          max={5}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('m1', v)}
        />
        <Slider
          label="Bob 2 mass (m2)"
          unit="kg"
          value={params.m2}
          min={0.2}
          max={5}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('m2', v)}
        />
      </fieldset>

      <fieldset>
        <legend>Rod lengths</legend>
        <Slider
          label="Rod 1 length (l1)"
          unit="m"
          value={params.l1}
          min={0.3}
          max={2}
          step={0.05}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => setParam('l1', v)}
        />
        <Slider
          label="Rod 2 length (l2)"
          unit="m"
          value={params.l2}
          min={0.3}
          max={2}
          step={0.05}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => setParam('l2', v)}
        />
      </fieldset>

      <fieldset>
        <legend>Gravity</legend>
        <Slider
          label="g"
          unit="m/s²"
          value={params.g}
          min={1}
          max={25}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => setParam('g', v)}
        />
        <p className="input-hint">{GRAVITY_HINT}</p>
      </fieldset>
    </div>
  );
}
