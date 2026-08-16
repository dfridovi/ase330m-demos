import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_MAGNITUDE, SERIES_PHASE, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;

export function FrequencyResponseCharts() {
  const frequencyResponse = useCarShocksStore((s) => s.frequencyResponse);
  const omega = useCarShocksStore((s) => s.omega);
  const steadyStateAtOmega = useCarShocksStore((s) => s.steadyStateAtOmega);

  const magnitudeData = useMemo(
    () => frequencyResponse.map((p) => ({ omega: p.omega, magnitude: p.magnitude })),
    [frequencyResponse],
  );
  const phaseData = useMemo(
    () => frequencyResponse.map((p) => ({ omega: p.omega, phase: p.phase * RAD_TO_DEG })),
    [frequencyResponse],
  );
  const phaseAtOmegaDeg = steadyStateAtOmega.phase * RAD_TO_DEG;

  return (
    <>
      <div className="chart-panel">
        <div className="chart-panel-title">
          Amplitude |X(ω)| <span className="chart-panel-unit">(m)</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={magnitudeData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="omega"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke={AXIS}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(1)}
              label={{ value: 'rad/s', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
            />
            <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={56} />
            <Tooltip
              contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
              labelFormatter={(v) => `ω = ${Number(v).toFixed(2)} rad/s`}
              formatter={(value) => Number(value).toFixed(4)}
            />
            <Line
              type="monotone"
              dataKey="magnitude"
              stroke={SERIES_MAGNITUDE}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot x={omega} y={steadyStateAtOmega.magnitude} r={5} fill={SERIES_MAGNITUDE} stroke={TEXT_PRIMARY} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-panel">
        <div className="chart-panel-title">
          Phase φ(ω) <span className="chart-panel-unit">(deg)</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={phaseData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="omega"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke={AXIS}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(1)}
              label={{ value: 'rad/s', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
            />
            <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={56} domain={[0, 180]} />
            <Tooltip
              contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
              labelFormatter={(v) => `ω = ${Number(v).toFixed(2)} rad/s`}
              formatter={(value) => Number(value).toFixed(2)}
            />
            <Line
              type="monotone"
              dataKey="phase"
              stroke={SERIES_PHASE}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot x={omega} y={phaseAtOmegaDeg} r={5} fill={SERIES_PHASE} stroke={TEXT_PRIMARY} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
