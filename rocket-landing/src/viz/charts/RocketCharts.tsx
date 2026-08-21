import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';
import { ActuatorEffortChart } from './ActuatorEffortChart.tsx';
import { CostConvergenceChart } from './CostConvergenceChart.tsx';
import { FuelChart } from './FuelChart.tsx';
import { GForceChart } from './GForceChart.tsx';

export function RocketCharts() {
  const history = useRocketLandingStore((s) => s.history);
  const lastCostHistory = useRocketLandingStore((s) => s.lastCostHistory);

  return (
    <div className="chart-grid">
      <ActuatorEffortChart history={history} />
      <FuelChart history={history} />
      <GForceChart history={history} />
      <CostConvergenceChart costHistory={lastCostHistory} />
    </div>
  );
}
