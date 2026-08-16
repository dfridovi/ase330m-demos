import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { TimeDomainChart } from './TimeDomainChart.tsx';

export function SpringExtensionChart() {
  const series = useCarShocksStore((s) => s.periodicSeries);
  return (
    <TimeDomainChart title="Spring extension x(t) — periodic forcing" series={series} showForce />
  );
}
