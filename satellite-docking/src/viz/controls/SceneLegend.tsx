import { BURN_ARROW, SERIES_CURRENT, SERIES_NAIVE, SERIES_OPEN_LOOP, SERIES_TUNED } from '../charts/theme';

const ITEMS: { label: string; color: string; swatch: 'line' | 'dash' | 'arrow' }[] = [
  { label: 'Your gain', color: SERIES_CURRENT, swatch: 'line' },
  { label: 'Naive', color: SERIES_NAIVE, swatch: 'dash' },
  { label: 'Tuned', color: SERIES_TUNED, swatch: 'dash' },
  { label: 'Open loop', color: SERIES_OPEN_LOOP, swatch: 'dash' },
  { label: 'Thrust', color: BURN_ARROW, swatch: 'arrow' },
];

/** Small overlay legend shared by the 2D and 3D views -- both draw the same four trajectories
 * plus the burn arrow, so the color key only needs to exist once. */
export function SceneLegend() {
  return (
    <div className="scene-legend">
      {ITEMS.map(({ label, color, swatch }) => (
        <span className="scene-legend-item" key={label}>
          <span className={`scene-legend-swatch scene-legend-swatch-${swatch}`} style={{ borderColor: color, background: swatch === 'line' || swatch === 'arrow' ? color : 'transparent' }} />
          {label}
        </span>
      ))}
    </div>
  );
}
