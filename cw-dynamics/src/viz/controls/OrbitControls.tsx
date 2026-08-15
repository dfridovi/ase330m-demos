import { useCwStore } from '../../store/cwStore';
import { Slider } from './Slider';

export function OrbitParamSliders() {
  const altitudeKm = useCwStore((s) => s.altitudeKm);
  const setAltitude = useCwStore((s) => s.setAltitude);
  const n = useCwStore((s) => s.n);
  const period = useCwStore((s) => s.period);

  return (
    <fieldset>
      <legend>Chief orbit</legend>
      <Slider
        label="Altitude"
        unit="km"
        value={altitudeKm}
        min={200}
        max={2000}
        step={10}
        formatValue={(v) => v.toFixed(0)}
        onChange={setAltitude}
      />
      <p className="input-hint">
        Circular orbit assumed. n = {n.toExponential(3)} rad/s, period = {(period / 60).toFixed(1)} min.
      </p>
    </fieldset>
  );
}
