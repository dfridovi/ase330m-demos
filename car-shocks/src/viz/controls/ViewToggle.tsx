import type { ResponseTab } from '../../store/carShocksStore.ts';
import { useCarShocksStore } from '../../store/carShocksStore.ts';

const TABS: { id: ResponseTab; label: string; title: string }[] = [
  {
    id: 'periodic',
    label: 'Periodic Forcing',
    title: 'Mechanic rhythmically pushing the hood — animated bounce and spring extension over time.',
  },
  { id: 'step', label: 'Step Response', title: 'Mechanic pushes down once and holds.' },
  { id: 'impulse', label: 'Impulse Response', title: 'Mechanic gives one sharp whack.' },
  {
    id: 'frequency',
    label: 'Frequency Response',
    title: 'Steady-state amplitude and phase vs. forcing frequency.',
  },
];

export function ViewToggle() {
  const activeTab = useCarShocksStore((s) => s.activeTab);
  const setActiveTab = useCarShocksStore((s) => s.setActiveTab);

  return (
    <div className="preset-selector view-toggle">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTab ? 'preset-button active' : 'preset-button'}
          onClick={() => setActiveTab(tab.id)}
          title={tab.title}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
