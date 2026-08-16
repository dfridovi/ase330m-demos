import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { SLIDER_RANGES } from '../../core/constants.ts';
import { Slider } from './Slider.tsx';

export function ParamSliders() {
  const m = useCarShocksStore((s) => s.m);
  const k = useCarShocksStore((s) => s.k);
  const c = useCarShocksStore((s) => s.c);
  const omega = useCarShocksStore((s) => s.omega);
  const f0 = useCarShocksStore((s) => s.f0);
  const I = useCarShocksStore((s) => s.I);
  const activeTab = useCarShocksStore((s) => s.activeTab);
  const setM = useCarShocksStore((s) => s.setM);
  const setK = useCarShocksStore((s) => s.setK);
  const setC = useCarShocksStore((s) => s.setC);
  const setOmega = useCarShocksStore((s) => s.setOmega);
  const setF0 = useCarShocksStore((s) => s.setF0);
  const setI = useCarShocksStore((s) => s.setI);

  const showF0 = activeTab === 'periodic' || activeTab === 'step';
  const showI = activeTab === 'impulse';
  const showOmega = activeTab === 'periodic' || activeTab === 'frequency';

  return (
    <fieldset>
      <legend>Car &amp; shocks</legend>
      <Slider
        label="Body mass m"
        unit="kg"
        value={m}
        {...SLIDER_RANGES.m}
        formatValue={(v) => v.toFixed(0)}
        onChange={setM}
      />
      <Slider
        label="Spring stiffness k"
        unit="N/m"
        value={k}
        {...SLIDER_RANGES.k}
        formatValue={(v) => v.toFixed(0)}
        onChange={setK}
      />
      <Slider
        label="Damping c"
        unit="N·s/m"
        value={c}
        {...SLIDER_RANGES.c}
        formatValue={(v) => v.toFixed(0)}
        onChange={setC}
      />
      {showF0 && (
        <Slider
          label="Push force f₀"
          unit="N"
          value={f0}
          {...SLIDER_RANGES.f0}
          formatValue={(v) => v.toFixed(0)}
          onChange={setF0}
        />
      )}
      {showI && (
        <Slider
          label="Whack impulse I"
          unit="N·s"
          value={I}
          {...SLIDER_RANGES.I}
          formatValue={(v) => v.toFixed(0)}
          onChange={setI}
        />
      )}
      {showOmega && (
        <Slider
          label="Forcing frequency ω"
          unit="rad/s"
          value={omega}
          {...SLIDER_RANGES.omega}
          formatValue={(v) => v.toFixed(2)}
          onChange={setOmega}
        />
      )}
    </fieldset>
  );
}
