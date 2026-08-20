import { useRendezvousStore } from '../../store/rendezvousStore';
import { StateChart } from './StateChart';
import { DistanceToTargetChart } from './DistanceToTargetChart';
import { EffortComparisonChart } from './EffortComparisonChart';

export function RendezvousCharts() {
  const viewMode = useRendezvousStore((s) => s.viewMode);
  const panelCount = viewMode === '3d' ? 5 : 4;

  return (
    <div className="chart-grid" style={{ gridTemplateColumns: `repeat(${panelCount}, 1fr)` }}>
      <DistanceToTargetChart />
      <EffortComparisonChart />
      <StateChart title="x(t) — radial" unit="m" index={0} />
      <StateChart title="y(t) — along-track" unit="m" index={1} />
      {viewMode === '3d' && <StateChart title="z(t) — cross-track" unit="m" index={2} />}
    </div>
  );
}
