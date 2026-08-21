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
import type { HistoryPoint } from '../../store/rocketLandingStore.ts';
import { TAU_MAX, T_MAX } from '../../core/constants.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_BOUND, SERIES_THRUST, SERIES_TORQUE, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from './theme.ts';

interface ActuatorEffortChartProps {
  history: HistoryPoint[];
}

/** T(t) and tau(t) overlaid on their own axes, each with a ReferenceLine at its actuator bound
 * (T in [0, T_MAX], tau in [-TAU_MAX, TAU_MAX]) -- no existing demo in this repo draws a
 * saturation/bound line, so this is a new but Recharts-native pattern. */
export function ActuatorEffortChart({ history }: ActuatorEffortChartProps) {
  const data = useMemo(() => history.map((h) => ({ t: h.t, thrust: h.thrust, torque: h.torque })), [history]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Actuator effort <span className="chart-panel-unit">(N, N·m)</span>
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
            label={{ value: 's', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
          />
          <YAxis
            yAxisId="thrust"
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            width={56}
            domain={[0, T_MAX * 1.1]}
          />
          <YAxis
            yAxisId="torque"
            orientation="right"
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            width={56}
            domain={[-TAU_MAX * 1.1, TAU_MAX * 1.1]}
          />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(0)}
          />
          <Legend
            verticalAlign="top"
            height={24}
            formatter={(value) => <span style={{ color: TEXT_SECONDARY }}>{value}</span>}
          />
          <Line
            yAxisId="thrust"
            type="monotone"
            dataKey="thrust"
            name="T(t)"
            stroke={SERIES_THRUST}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="torque"
            type="monotone"
            dataKey="torque"
            name="τ(t)"
            stroke={SERIES_TORQUE}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceLine yAxisId="thrust" y={0} stroke={SERIES_BOUND} strokeDasharray="3 3" />
          <ReferenceLine
            yAxisId="thrust"
            y={T_MAX}
            stroke={SERIES_BOUND}
            strokeDasharray="3 3"
            label={{ value: 'T_max', position: 'insideTopLeft', fill: SERIES_BOUND, fontSize: 10 }}
          />
          <ReferenceLine
            yAxisId="torque"
            y={TAU_MAX}
            stroke={SERIES_BOUND}
            strokeDasharray="3 3"
            label={{ value: '+τ_max', position: 'insideTopRight', fill: SERIES_BOUND, fontSize: 10 }}
          />
          <ReferenceLine
            yAxisId="torque"
            y={-TAU_MAX}
            stroke={SERIES_BOUND}
            strokeDasharray="3 3"
            label={{ value: '-τ_max', position: 'insideBottomRight', fill: SERIES_BOUND, fontSize: 10 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
