import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SeriesPoint } from '../../core/types/params.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import {
  AXIS,
  CHART_SURFACE,
  GRIDLINE,
  SERIES_DISPLACEMENT,
  SERIES_FORCE,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from './theme.ts';

interface TimeDomainChartProps {
  title: string;
  series: SeriesPoint[];
  // Periodic/step forcing: overlay the continuous f(t) on a secondary y-axis.
  showForce?: boolean;
  // Impulse forcing: f(t) is a Dirac delta, not a sampleable curve — mark it as an
  // instantaneous event at t=0 instead of a continuous overlay.
  impulseMagnitude?: number;
}

/** Shared x(t) plot reused by the periodic/step/impulse tabs — same shape, different series. */
export function TimeDomainChart({ title, series, showForce, impulseMagnitude }: TimeDomainChartProps) {
  const playheadTime = useChartPlayheadTime();
  const data = useMemo(() => series.map((p) => ({ t: p.t, x: p.x, f: p.f })), [series]);

  return (
    <div className="chart-panel chart-panel--wide">
      <div className="chart-panel-title">
        {title} <span className="chart-panel-unit">(m)</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            tickFormatter={(t: number) => t.toFixed(1)}
            label={{ value: 's', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
          />
          <YAxis yAxisId="x" stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={56} />
          {showForce && (
            <YAxis
              yAxisId="f"
              orientation="right"
              stroke={AXIS}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              width={56}
              label={{ value: 'N', position: 'insideTopRight', fill: TEXT_MUTED, fontSize: 11, offset: -4 }}
            />
          )}
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(3)} s`}
            formatter={(value) => Number(value).toFixed(4)}
          />
          {showForce && (
            <Legend
              verticalAlign="top"
              height={24}
              formatter={(value) => <span style={{ color: TEXT_SECONDARY }}>{value}</span>}
            />
          )}
          <Line
            yAxisId="x"
            type="monotone"
            dataKey="x"
            name="x(t)"
            stroke={SERIES_DISPLACEMENT}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {showForce && (
            <Line
              yAxisId="f"
              type="monotone"
              dataKey="f"
              name="f(t)"
              stroke={SERIES_FORCE}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {impulseMagnitude !== undefined && (
            <ReferenceLine
              yAxisId="x"
              x={0}
              stroke={SERIES_FORCE}
              strokeDasharray="2 2"
              label={{
                value: `impulse I·δ(t) = ${impulseMagnitude} N·s`,
                position: 'insideTopLeft',
                fill: SERIES_FORCE,
                fontSize: 11,
              }}
            />
          )}
          {playheadTime !== PLAYHEAD_FROZEN && (
            <ReferenceLine yAxisId="x" x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
