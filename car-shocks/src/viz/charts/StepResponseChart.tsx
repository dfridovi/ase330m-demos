import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { TimeDomainChart } from './TimeDomainChart.tsx';

export function StepResponseChart() {
  const series = useCarShocksStore((s) => s.stepSeries);
  return <TimeDomainChart title="Step response x(t)" series={series} showForce />;
}
