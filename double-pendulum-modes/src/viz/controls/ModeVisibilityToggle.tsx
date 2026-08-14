import { usePendulumStore } from '../../store/pendulumStore.ts';
import { SERIES_FULL, SERIES_MODE_1, SERIES_MODE_2 } from '../charts/theme.ts';

export function ModeVisibilityToggle() {
  const showFull = usePendulumStore((s) => s.showFull);
  const showMode1 = usePendulumStore((s) => s.showMode1);
  const showMode2 = usePendulumStore((s) => s.showMode2);
  const setShowFull = usePendulumStore((s) => s.setShowFull);
  const setShowMode1 = usePendulumStore((s) => s.setShowMode1);
  const setShowMode2 = usePendulumStore((s) => s.setShowMode2);

  return (
    <div className="mode-visibility-toggle">
      <label>
        <input type="checkbox" checked={showFull} onChange={(e) => setShowFull(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_FULL }} />
        Full response
      </label>
      <label>
        <input type="checkbox" checked={showMode1} onChange={(e) => setShowMode1(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_MODE_1 }} />
        Mode 1 alone
      </label>
      <label>
        <input type="checkbox" checked={showMode2} onChange={(e) => setShowMode2(e.target.checked)} />
        <span className="swatch" style={{ background: SERIES_MODE_2 }} />
        Mode 2 alone
      </label>
    </div>
  );
}
