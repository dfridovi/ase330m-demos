import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_COST, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

interface CostConvergenceChartProps {
  costHistory: number[];
}

/** iLQR's cost after each accepted forward pass of the most recent solve -- a fuller settle solve
 * while paused (tens of iterations), or just the latest live tick's couple of real-time-iteration
 * steps while playing. Log-scaled since the cost typically drops across a couple of orders of
 * magnitude in the first few iterations, then levels off near convergence. */
export function CostConvergenceChart({ costHistory }: CostConvergenceChartProps) {
  const data = useMemo(() => costHistory.map((cost, iteration) => ({ iteration, cost })), [costHistory]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">iLQR cost vs. iteration</div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="iteration"
            type="number"
            allowDecimals={false}
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
          />
          <YAxis
            scale="log"
            domain={['auto', 'auto']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            width={48}
            tickFormatter={(v: number) => v.toExponential(0)}
          />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(iteration) => `iteration ${iteration}`}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Line
            type="monotone"
            dataKey="cost"
            stroke={SERIES_COST}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
