import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { SpringExtensionChart } from './SpringExtensionChart.tsx';
import { StepResponseChart } from './StepResponseChart.tsx';
import { ImpulseResponseChart } from './ImpulseResponseChart.tsx';
import { FrequencyResponseCharts } from './FrequencyResponseCharts.tsx';

export function ResponseCharts() {
  const activeTab = useCarShocksStore((s) => s.activeTab);

  return (
    <div className="chart-grid">
      {activeTab === 'periodic' && <SpringExtensionChart />}
      {activeTab === 'step' && <StepResponseChart />}
      {activeTab === 'impulse' && <ImpulseResponseChart />}
      {activeTab === 'frequency' && <FrequencyResponseCharts />}
    </div>
  );
}
