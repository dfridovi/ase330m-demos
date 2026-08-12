import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS, CHART_SURFACE, GRIDLINE, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

export interface TimeSeriesPoint {
  t: number;
  value: number;
}

interface TimeSeriesPanelProps {
  title: string;
  unit: string;
  data: TimeSeriesPoint[];
  color: string;
  syncId?: string;
  currentTime?: number;
}

export function TimeSeriesPanel({ title, unit, data, color, syncId, currentTime }: TimeSeriesPanelProps) {
  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        {title} <span className="chart-panel-unit">({unit})</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} syncId={syncId} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            tickFormatter={(t: number) => t.toFixed(0)}
          />
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(4)}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
          {currentTime !== undefined && <ReferenceLine x={currentTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
