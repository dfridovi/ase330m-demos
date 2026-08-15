import { useCwStore } from '../../store/cwStore';
import { SERIES_CROSS_TRACK, SERIES_DRIFT, SERIES_FULL, SERIES_IN_PLANE } from '../charts/theme';

export function ModeVisibilityToggle() {
  const showFull = useCwStore((s) => s.showFull);
  const showDrift = useCwStore((s) => s.showDrift);
  const showInPlane = useCwStore((s) => s.showInPlane);
  const showCrossTrack = useCwStore((s) => s.showCrossTrack);
  const setShowFull = useCwStore((s) => s.setShowFull);
  const setShowDrift = useCwStore((s) => s.setShowDrift);
  const setShowInPlane = useCwStore((s) => s.setShowInPlane);
  const setShowCrossTrack = useCwStore((s) => s.setShowCrossTrack);

  return (
    <div className="mode-visibility-toggle">
      <label>
        <input type="checkbox" checked={showFull} onChange={(e) => setShowFull(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_FULL }} />
        Full response
      </label>
      <label title="Non-oscillatory: constant offset in x, constant + secular (t) term in y.">
        <input type="checkbox" checked={showDrift} onChange={(e) => setShowDrift(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_DRIFT }} />
        Drift (secular)
      </label>
      <label title="Bounded oscillation at frequency n — the 2:1 in-plane ellipse.">
        <input type="checkbox" checked={showInPlane} onChange={(e) => setShowInPlane(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_IN_PLANE }} />
        In-plane oscillation
      </label>
      <label title="Decoupled out-of-plane oscillation, also at frequency n.">
        <input type="checkbox" checked={showCrossTrack} onChange={(e) => setShowCrossTrack(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_CROSS_TRACK }} />
        Cross-track
      </label>
    </div>
  );
}
