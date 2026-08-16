import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { TimeDomainChart } from './TimeDomainChart.tsx';

export function ImpulseResponseChart() {
  const series = useCarShocksStore((s) => s.impulseSeries);
  const I = useCarShocksStore((s) => s.I);
  return <TimeDomainChart title="Impulse response x(t)" series={series} impulseMagnitude={I} />;
}
