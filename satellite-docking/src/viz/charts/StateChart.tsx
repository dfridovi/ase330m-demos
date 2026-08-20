import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { alignComparisonSeries, useRendezvousStore } from '../../store/rendezvousStore';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime';
import {
  AXIS,
  CHART_SURFACE,
  GRIDLINE,
  SERIES_CURRENT,
  SERIES_NAIVE,
  SERIES_OPEN_LOOP,
  SERIES_TUNED,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from './theme';

interface StateChartProps {
  title: string;
  unit: string;
  /** Index into the 6-state [x, y, z, vx, vy, vz] vector. */
  index: number;
}

/** Time-domain plot of one state component -- your gain vs. the naive/tuned reference gains
 * and the uncontrolled (open-loop) baseline, all from the same initial condition. */
export function StateChart({ title, unit, index }: StateChartProps) {
  const current = useRendezvousStore((s) => s.current);
  const naive = useRendezvousStore((s) => s.naive);
  const tuned = useRendezvousStore((s) => s.tuned);
  const openLoop = useRendezvousStore((s) => s.openLoop);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(() => {
    const aligned = alignComparisonSeries(current, naive, tuned, openLoop, (s) => s.trajectory.x.map((row) => row[index]));
    return aligned.t.map((t, i) => ({
      t,
      'Your gain': aligned.current[i],
      Naive: aligned.naive[i],
      Tuned: aligned.tuned[i],
      'Open loop': aligned.openLoop[i],
    }));
  }, [current, naive, tuned, openLoop, index]);

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
            tickFormatter={(t: number) => t.toFixed(0)}
            label={{ value: 's', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
          />
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(0)} s`}
            formatter={(value) => Number(value).toFixed(3)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          <ReferenceLine y={0} stroke={AXIS} strokeWidth={1} />
          <Line type="monotone" dataKey="Your gain" stroke={SERIES_CURRENT} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="Naive"
            stroke={SERIES_NAIVE}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Tuned"
            stroke={SERIES_TUNED}
            strokeWidth={2}
            strokeDasharray="2 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Open loop"
            stroke={SERIES_OPEN_LOOP}
            strokeWidth={1.5}
            strokeDasharray="1 3"
            dot={false}
            isAnimationActive={false}
          />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
