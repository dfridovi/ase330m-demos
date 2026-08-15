import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useCwStore } from '../../store/cwStore';
import { toRenderPosition } from './coords';
import { SERIES_DRIFT, SERIES_FULL, SERIES_IN_PLANE } from '../charts/theme';
import type { RelativeState } from '../../core/types/orbit';

function toPoints(series: RelativeState[]): [number, number, number][] {
  return series.map((s) => toRenderPosition(s));
}

/** Static (non-animated) full/drift/in-plane 3D paths, recomputed only when the trajectory itself changes. */
export function StaticOrbitPaths() {
  const timeSeries = useCwStore((s) => s.timeSeries);
  const showFull = useCwStore((s) => s.showFull);
  const showDrift = useCwStore((s) => s.showDrift);
  const showInPlane = useCwStore((s) => s.showInPlane);

  const points = useMemo(
    () => ({
      full: toPoints(timeSeries.full),
      drift: toPoints(timeSeries.drift),
      inPlane: toPoints(timeSeries.inPlane),
    }),
    [timeSeries],
  );

  return (
    <>
      {showInPlane && <Line points={points.inPlane} color={SERIES_IN_PLANE} lineWidth={1.5} dashed dashSize={0.06} gapSize={0.04} />}
      {showDrift && <Line points={points.drift} color={SERIES_DRIFT} lineWidth={1.5} dashed dashSize={0.03} gapSize={0.04} />}
      {showFull && <Line points={points.full} color={SERIES_FULL} lineWidth={1} />}
    </>
  );
}
