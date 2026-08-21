import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistoryPoint } from '../../store/rocketLandingStore.ts';
import { DEFAULT_FUEL } from '../../core/constants.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_FUEL, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

interface FuelChartProps {
  history: HistoryPoint[];
}

export function FuelChart({ history }: FuelChartProps) {
  const data = useMemo(() => history.map((h) => ({ t: h.t, fuel: h.fuel })), [history]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Fuel remaining <span className="chart-panel-unit">(kg)</span>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            tickFormatter={(t: number) => t.toFixed(0)}
          />
          <YAxis
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            width={48}
            domain={[0, DEFAULT_FUEL]}
          />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(1)}
          />
          <Area
            type="monotone"
            dataKey="fuel"
            stroke={SERIES_FUEL}
            fill={SERIES_FUEL}
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
