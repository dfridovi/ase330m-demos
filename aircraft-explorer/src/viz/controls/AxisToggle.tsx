import type { Axis } from '../../store/simulationStore.ts';
import { useSimulationStore } from '../../store/simulationStore.ts';

const AXES: { id: Axis; label: string; title: string }[] = [
  { id: 'longitudinal', label: 'Longitudinal', title: 'Pitch/climb dynamics: short period and phugoid modes.' },
  { id: 'lateral', label: 'Lateral-Directional', title: 'Roll/yaw dynamics: roll subsidence, dutch roll, and spiral modes.' },
];

export function AxisToggle() {
  const activeAxis = useSimulationStore((s) => s.activeAxis);
  const setAxis = useSimulationStore((s) => s.setAxis);

  return (
    <div className="preset-selector axis-toggle">
      {AXES.map((axis) => (
        <button
          key={axis.id}
          type="button"
          className={axis.id === activeAxis ? 'preset-button active' : 'preset-button'}
          onClick={() => setAxis(axis.id)}
          title={axis.title}
        >
          {axis.label}
        </button>
      ))}
    </div>
  );
}
