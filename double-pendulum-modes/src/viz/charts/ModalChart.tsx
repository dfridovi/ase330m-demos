import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePendulumStore } from '../../store/pendulumStore.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_FULL, SERIES_MODE_1, SERIES_MODE_2, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;

interface ModalChartProps {
  title: string;
  stateIndex: 0 | 1; // 0 = theta1, 1 = theta2
}

export function ModalChart({ title, stateIndex }: ModalChartProps) {
  const modal = usePendulumStore((s) => s.modal);
  const playheadTime = useChartPlayheadTime();

  const data = useMemo(() => {
    return modal.fullResponse.t.map((t, i) => ({
      t,
      Full: modal.fullResponse.x[i][stateIndex] * RAD_TO_DEG,
      'Mode 1': modal.modeResponses[0].x[i][stateIndex] * RAD_TO_DEG,
      'Mode 2': modal.modeResponses[1].x[i][stateIndex] * RAD_TO_DEG,
    }));
  }, [modal, stateIndex]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        {title} <span className="chart-panel-unit">(deg)</span>
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
          />
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(2)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          <Line type="monotone" dataKey="Full" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="Mode 1"
            stroke={SERIES_MODE_1}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Mode 2"
            stroke={SERIES_MODE_2}
            strokeWidth={2}
            strokeDasharray="2 3"
            dot={false}
            isAnimationActive={false}
          />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
