import { ModalChart } from './ModalChart.tsx';
import { EnergyChart } from './EnergyChart.tsx';

export function ModalCharts() {
  return (
    <div className="chart-grid">
      <ModalChart title="θ1(t)" stateIndex={0} />
      <ModalChart title="θ2(t)" stateIndex={1} />
      <EnergyChart />
    </div>
  );
}
