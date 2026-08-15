import type { ViewMode } from '../../store/cwStore';
import { useCwStore } from '../../store/cwStore';

const VIEWS: { id: ViewMode; label: string; title: string }[] = [
  { id: '2d', label: '2D (radial / along-track)', title: 'The LVLH orbital plane, matching the MATLAB animatedline plot.' },
  { id: '3d', label: '3D', title: 'Full 3D relative motion including the cross-track (out-of-plane) axis.' },
];

export function ViewToggle() {
  const viewMode = useCwStore((s) => s.viewMode);
  const setViewMode = useCwStore((s) => s.setViewMode);

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
