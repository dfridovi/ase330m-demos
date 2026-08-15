import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCwStore } from '../../store/cwStore';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime';
import type { RelativeState } from '../../core/types/orbit';
import {
  AXIS,
  CHART_SURFACE,
  GRIDLINE,
  SERIES_CROSS_TRACK,
  SERIES_DRIFT,
  SERIES_FULL,
  SERIES_IN_PLANE,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from './theme';

interface StateChartProps {
  title: string;
  unit: string;
  extract: (s: RelativeState) => number;
}

/** Time-domain plot of one coordinate, overlaid with its drift/in-plane/cross-track decomposition. */
export function StateChart({ title, unit, extract }: StateChartProps) {
  const timeSeries = useCwStore((s) => s.timeSeries);
  const showFull = useCwStore((s) => s.showFull);
  const showDrift = useCwStore((s) => s.showDrift);
  const showInPlane = useCwStore((s) => s.showInPlane);
  const showCrossTrack = useCwStore((s) => s.showCrossTrack);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(() => {
    return timeSeries.t.map((t, i) => ({
      t: t / 3600,
      Full: extract(timeSeries.full[i]),
      Drift: extract(timeSeries.drift[i]),
      'In-plane': extract(timeSeries.inPlane[i]),
      'Cross-track': extract(timeSeries.crossTrack[i]),
    }));
  }, [timeSeries, extract]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        {title} <span className="chart-panel-unit">({unit})</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            tickFormatter={(t: number) => t.toFixed(1)}
            label={{ value: 'hr', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
          />
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} hr`}
            formatter={(value) => Number(value).toFixed(3)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          {showFull && (
            <Line type="monotone" dataKey="Full" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
          )}
          {showDrift && (
            <Line
              type="monotone"
              dataKey="Drift"
              stroke={SERIES_DRIFT}
              strokeWidth={2}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {showInPlane && (
            <Line
              type="monotone"
              dataKey="In-plane"
              stroke={SERIES_IN_PLANE}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {showCrossTrack && (
            <Line
              type="monotone"
              dataKey="Cross-track"
              stroke={SERIES_CROSS_TRACK}
              strokeWidth={2}
              strokeDasharray="1 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime / 3600} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
