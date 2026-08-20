import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { alignComparisonSeries, CAPTURE_THRESHOLD_M, useRendezvousStore } from '../../store/rendezvousStore';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime';
import {
  AXIS,
  CHART_SURFACE,
  DANGER,
  GRIDLINE,
  SERIES_CURRENT,
  SERIES_NAIVE,
  SERIES_OPEN_LOOP,
  SERIES_TUNED,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from './theme';

// Floored well below the capture threshold: distance is a norm and essentially never hits
// exactly zero, but a log-scale axis breaks on it if float noise ever does.
const MIN_DISPLAYED_DISTANCE = 1e-6;

/** Distance from the chief over time -- your gain vs. the naive/tuned reference gains and the
 * uncontrolled (open-loop) baseline, all from the same initial condition, with the capture
 * threshold called out. The demo's primary "did you get close enough, and how does that compare"
 * readout. */
export function DistanceToTargetChart() {
  const current = useRendezvousStore((s) => s.current);
  const naive = useRendezvousStore((s) => s.naive);
  const tuned = useRendezvousStore((s) => s.tuned);
  const openLoop = useRendezvousStore((s) => s.openLoop);
  const timeToCaptureS = useRendezvousStore((s) => s.timeToCaptureS);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(() => {
    const aligned = alignComparisonSeries(current, naive, tuned, openLoop, (s) => s.distance);
    const floor = (v: number) => Math.max(v, MIN_DISPLAYED_DISTANCE);
    return aligned.t.map((t, i) => ({
      t,
      'Your gain': floor(aligned.current[i]),
      Naive: floor(aligned.naive[i]),
      Tuned: floor(aligned.tuned[i]),
      'Open loop': floor(aligned.openLoop[i]),
    }));
  }, [current, naive, tuned, openLoop]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Distance to target <span className="chart-panel-unit">(m)</span>
        {timeToCaptureS !== null && <span className="chart-panel-tag">captured at t={timeToCaptureS.toFixed(0)}s</span>}
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
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} scale="log" domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(0)} s`}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          <ReferenceLine
            y={CAPTURE_THRESHOLD_M}
            stroke={DANGER}
            strokeDasharray="4 4"
            label={{ value: 'capture', fill: DANGER, fontSize: 10, position: 'insideTopRight' }}
          />
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
