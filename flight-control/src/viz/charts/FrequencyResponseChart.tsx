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
import { useControlStore } from '../../store/controlStore.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_DUTCH_ROLL, SERIES_FULL, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;

const CHANNEL_LABELS = ['Δu', 'α', 'q', 'θ'];

/** Linear interpolation for the marker's y-value at the current sinusoid omega, since the
 * sweep's log-spaced samples rarely land exactly on it. */
function interpolateAt(points: { omega: number; value: number }[], omega: number): number {
  if (omega <= points[0].omega) return points[0].value;
  const last = points.length - 1;
  if (omega >= points[last].omega) return points[last].value;
  let i = 0;
  while (points[i + 1].omega < omega) i++;
  const a = points[i];
  const b = points[i + 1];
  const frac = (omega - a.omega) / (b.omega - a.omega);
  return a.value + (b.value - a.value) * frac;
}

export function FrequencyResponseChart() {
  const frequencyResponse = useControlStore((s) => s.frequencyResponse);
  const sinusoidOmega = useControlStore((s) => s.sinusoidOmega);
  const activeChannel = useControlStore((s) => s.activeChannel);
  const channelLabel = CHANNEL_LABELS[activeChannel];

  const magnitudeData = useMemo(
    () => frequencyResponse.map((p) => ({ omega: p.omega, value: p.magnitude })),
    [frequencyResponse],
  );
  const phaseData = useMemo(
    () => frequencyResponse.map((p) => ({ omega: p.omega, value: p.phase * RAD_TO_DEG })),
    [frequencyResponse],
  );
  const magnitudeAtOmega = interpolateAt(magnitudeData, sinusoidOmega);
  const phaseAtOmega = interpolateAt(phaseData, sinusoidOmega);

  return (
    <>
      <div className="chart-panel">
        <div className="chart-panel-title">
          |{channelLabel}(iω) / {channelLabel}<sub>ref</sub>(iω)|
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={magnitudeData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="omega"
              type="number"
              scale="log"
              domain={['dataMin', 'dataMax']}
              stroke={AXIS}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(2)}
              label={{ value: 'ω (rad/s)', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
            />
            <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
            <Tooltip
              contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
              labelFormatter={(v) => `ω = ${Number(v).toFixed(3)} rad/s`}
              formatter={(value) => Number(value).toFixed(4)}
            />
            <Line type="monotone" dataKey="value" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
            <ReferenceDot x={sinusoidOmega} y={magnitudeAtOmega} r={5} fill={SERIES_FULL} stroke={TEXT_PRIMARY} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-panel">
        <div className="chart-panel-title">
          Phase <span className="chart-panel-unit">(deg)</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={phaseData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="omega"
              type="number"
              scale="log"
              domain={['dataMin', 'dataMax']}
              stroke={AXIS}
              tick={{ fill: TEXT_MUTED, fontSize: 11 }}
              tickFormatter={(v: number) => v.toFixed(2)}
              label={{ value: 'ω (rad/s)', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -2 }}
            />
            <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} domain={[-180, 180]} />
            <Tooltip
              contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
              labelFormatter={(v) => `ω = ${Number(v).toFixed(3)} rad/s`}
              formatter={(value) => Number(value).toFixed(2)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={SERIES_DUTCH_ROLL}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot x={sinusoidOmega} y={phaseAtOmega} r={5} fill={SERIES_DUTCH_ROLL} stroke={TEXT_PRIMARY} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
