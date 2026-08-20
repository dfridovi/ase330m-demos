import type { ViewMode } from '../../store/rendezvousStore';
import { useRendezvousStore } from '../../store/rendezvousStore';

// This toggle doubles as the exercise's stage progression: '2d' is the in-plane stage (2
// thrusters, 4 states), '3d' is the full stage (adds the cross-track thruster and states) --
// one button per stage instead of a separate, confusingly-also-"3D"-labeled stage toggle.
const VIEWS: { id: ViewMode; label: string; title: string }[] = [
  { id: '2d', label: '1. In-plane (2D)', title: 'Radial/along-track only: 2 thrusters, 4 states, shown in the LVLH plane.' },
  { id: '3d', label: '2. Full 3D', title: 'Adds cross-track: 3 thrusters, 6 states, shown in a 3D scene.' },
];

export function ViewToggle() {
  const viewMode = useRendezvousStore((s) => s.viewMode);
  const setViewMode = useRendezvousStore((s) => s.setViewMode);

  return (
    <div className="preset-selector view-toggle">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          className={view.id === viewMode ? 'preset-button active' : 'preset-button'}
          onClick={() => setViewMode(view.id)}
          title={view.title}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
