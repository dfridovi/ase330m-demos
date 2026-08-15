import { StateChart } from './StateChart';
import { CaptureDistanceChart } from './CaptureDistanceChart';
import { DriftMagnitudeChart } from './DriftMagnitudeChart';

export function RelativeOrbitCharts() {
  return (
    <div className="chart-grid">
      <StateChart title="x(t) — radial" unit="km" extract={(s) => s.x / 1000} />
      <StateChart title="y(t) — along-track" unit="km" extract={(s) => s.y / 1000} />
      <StateChart title="z(t) — cross-track" unit="km" extract={(s) => s.z / 1000} />
      <CaptureDistanceChart />
      <DriftMagnitudeChart />
    </div>
  );
}
