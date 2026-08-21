import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryPoint } from '../../store/rocketLandingStore.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_GFORCE, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

interface GForceChartProps {
  history: HistoryPoint[];
}

/** Specific force along the body axis, in g's -- T/mass normalized by g0. The only
 * non-gravitational acceleration this planar model applies, so it tracks the thrust chart's
 * shape but reframed as "how many g's is this landing pulling," a more familiar aerospace
 * intuition than raw Newtons. */
export function GForceChart({ history }: GForceChartProps) {
  const data = useMemo(() => history.map((h) => ({ t: h.t, gForce: h.gForce })), [history]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Specific force <span className="chart-panel-unit">(g)</span>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            tickFormatter={(t: number) => t.toFixed(0)}
          />
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={40} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Line
            type="monotone"
            dataKey="gForce"
            stroke={SERIES_GFORCE}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
