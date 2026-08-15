import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCwStore } from '../../store/cwStore';
import { captureDistance } from '../../core/sim/simulate';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_FULL, TEXT_MUTED, TEXT_PRIMARY } from './theme';

// Matches clohessy_wiltshire.m's first figure: distance between chaser and chief vs time.
export function CaptureDistanceChart() {
  const timeSeries = useCwStore((s) => s.timeSeries);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(
    () => timeSeries.t.map((t, i) => ({ t: t / 3600, distance: captureDistance(timeSeries.full[i]) / 1000 })),
    [timeSeries],
  );

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Capture distance <span className="chart-panel-unit">(km)</span>
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
          <Line type="monotone" dataKey="distance" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime / 3600} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
