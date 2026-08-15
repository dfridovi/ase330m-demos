import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCwStore } from '../../store/cwStore';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_CROSS_TRACK, SERIES_DRIFT, SERIES_IN_PLANE, TEXT_MUTED, TEXT_PRIMARY } from './theme';

function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

// The pedagogical point of this chart: the drift mode's magnitude has no ceiling — it's a
// straight line that keeps climbing — while the two genuinely oscillatory modes (in-plane and
// cross-track) trace a bounded, repeating envelope forever. That's the same "repeated root"
// signature students see when a lightly-damped oscillator is forced at its natural frequency;
// see the mode table's note on the Jordan block for why it shows up here in a free response.
export function DriftMagnitudeChart() {
  const timeSeries = useCwStore((s) => s.timeSeries);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(
    () =>
      timeSeries.t.map((t, i) => ({
        t: t / 3600,
        Drift: magnitude(timeSeries.drift[i].x, timeSeries.drift[i].y, timeSeries.drift[i].z) / 1000,
        'In-plane': magnitude(timeSeries.inPlane[i].x, timeSeries.inPlane[i].y, timeSeries.inPlane[i].z) / 1000,
        'Cross-track': magnitude(timeSeries.crossTrack[i].x, timeSeries.crossTrack[i].y, timeSeries.crossTrack[i].z) / 1000,
      })),
    [timeSeries],
  );

  return (
    <div className="chart-panel chart-panel--wide">
      <div className="chart-panel-title">
        Mode magnitude — unbounded drift vs. bounded oscillation <span className="chart-panel-unit">(km)</span>
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
          <Line type="monotone" dataKey="Drift" stroke={SERIES_DRIFT} strokeWidth={2} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="In-plane"
            stroke={SERIES_IN_PLANE}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Cross-track"
            stroke={SERIES_CROSS_TRACK}
            strokeWidth={2}
            strokeDasharray="1 4"
            dot={false}
            isAnimationActive={false}
          />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime / 3600} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
