import { ModalChart } from './ModalChart.tsx';

export function ModalCharts() {
  return (
    <div className="chart-grid">
      <ModalChart title="θ1(t)" stateIndex={0} />
      <ModalChart title="θ2(t)" stateIndex={1} />
    </div>
  );
}
