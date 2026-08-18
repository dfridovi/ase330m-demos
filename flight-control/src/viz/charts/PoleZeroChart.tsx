import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useControlStore } from '../../store/controlStore.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_DUTCH_ROLL, SERIES_FULL, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

function ZeroMark({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null;
  const r = 5;
  return (
    <g stroke={TEXT_PRIMARY} strokeWidth={2}>
      <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} />
      <line x1={cx - r} y1={cy + r} x2={cx + r} y2={cy - r} />
    </g>
  );
}

// A true hollow circle (stroke only) so it reads as "○" against the closed-loop poles' solid
// filled dots — recharts' default Scatter marker is always filled, so open-loop poles need
// this custom shape to visually match the "open" vs "closed" language in the caption below.
function OpenLoopPoleMark({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx === undefined || cy === undefined) return null;
  return <circle cx={cx} cy={cy} r={5} fill="none" stroke={TEXT_MUTED} strokeWidth={2} />;
}

export function PoleZeroChart() {
  const openLoopPoles = useControlStore((s) => s.openLoopPoles);
  const closedLoopPoles = useControlStore((s) => s.closedLoopPoles);
  const zeros = useControlStore((s) => s.zeros);

  const openLoopData = useMemo(() => openLoopPoles.map((p) => ({ re: p.re, im: p.im })), [openLoopPoles]);
  const closedLoopData = useMemo(() => closedLoopPoles.map((p) => ({ re: p.re, im: p.im })), [closedLoopPoles]);
  const zeroData = useMemo(() => zeros.map((z) => ({ re: z.re, im: z.im })), [zeros]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Pole/zero map
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} />
          <XAxis
            dataKey="re"
            type="number"
            name="Re"
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            label={{ value: 'Re(s)', position: 'insideBottomRight', fill: TEXT_MUTED, fontSize: 11, offset: -4 }}
          />
          <YAxis
            dataKey="im"
            type="number"
            name="Im"
            stroke={AXIS}
            tick={{ fill: TEXT_MUTED, fontSize: 11 }}
            width={48}
            label={{ value: 'Im(s)', angle: -90, position: 'insideLeft', fill: TEXT_MUTED, fontSize: 11 }}
          />
          <ZAxis range={[60, 60]} />
          <ReferenceLine x={0} stroke={AXIS} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            formatter={(value) => Number(value).toFixed(3)}
          />
          <Scatter name="Open-loop poles" data={openLoopData} shape={OpenLoopPoleMark} />
          <Scatter name="Closed-loop poles" data={closedLoopData} fill={SERIES_FULL} />
          <Scatter name="Zeros" data={zeroData} shape={ZeroMark} fill={SERIES_DUTCH_ROLL} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="input-hint">
        ○ gray hollow circles are the open-loop poles, ● blue filled circles are the closed-loop poles (eig(A-BK) —
        these move as you tune K), and × marks are the transmission zeros, which state feedback never moves.
      </p>
    </div>
  );
}
