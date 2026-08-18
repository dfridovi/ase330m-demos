import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useControlStore } from '../../store/controlStore.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_FULL, SERIES_SHORT_PERIOD, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;

const PANELS = [
  { index: 0, title: 'Δu', unit: 'm/s', scale: 1 },
  { index: 1, title: 'α', unit: 'deg', scale: RAD_TO_DEG },
  { index: 2, title: 'q', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 3, title: 'θ', unit: 'deg', scale: RAD_TO_DEG },
];

interface OverlayPoint {
  t: number;
  x: number;
  xRef: number;
}

function OverlayPanel({
  title,
  unit,
  data,
  isTracked,
  playheadTime,
}: {
  title: string;
  unit: string;
  data: OverlayPoint[];
  isTracked: boolean;
  playheadTime: number;
}) {
  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        {title} <span className="chart-panel-unit">({unit})</span>
        {isTracked && <span className="chart-panel-tag">tracked</span>}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} syncId="tracking" margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRIDLINE} vertical={false} />
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
          <Line type="monotone" dataKey="x" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="xRef"
            stroke={SERIES_SHORT_PERIOD}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            isAnimationActive={false}
          />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrackingCharts() {
  const trajectory = useControlStore((s) => s.trajectory);
  const xRefTrajectory = useControlStore((s) => s.xRefTrajectory);
  const activeChannel = useControlStore((s) => s.activeChannel);
  const diverged = useControlStore((s) => s.diverged);
  const playheadTime = useChartPlayheadTime();

  const seriesByPanel = useMemo(
    () =>
      PANELS.map(({ index, scale }) =>
        trajectory.t.map(
          (t, i): OverlayPoint => ({
            t,
            x: trajectory.x[i][index] * scale,
            xRef: xRefTrajectory.x[i][index] * scale,
          }),
        ),
      ),
    [trajectory, xRefTrajectory],
  );

  const errorSeries = useMemo(
    () =>
      trajectory.t.map((t, i) => ({
        t,
        value:
          (trajectory.x[i][activeChannel] - xRefTrajectory.x[i][activeChannel]) *
          (activeChannel === 0 ? 1 : RAD_TO_DEG),
      })),
    [trajectory, xRefTrajectory, activeChannel],
  );

  return (
    <div>
      {diverged && (
        <p className="diverged-banner">
          Unstable — the response diverged before this K stopped being useful to show. Try a smaller |K| or the
          opposite sign.
        </p>
      )}
      <div className="chart-grid">
        {PANELS.map((panel, panelIdx) => (
          <OverlayPanel
            key={panel.title}
            title={panel.title}
            unit={panel.unit}
            data={seriesByPanel[panelIdx]}
            isTracked={panel.index === activeChannel}
            playheadTime={playheadTime}
          />
        ))}
      </div>
      <div className="chart-panel">
        <div className="chart-panel-title">
          Tracking error e(t) = x - x<sub>ref</sub>{' '}
          <span className="chart-panel-unit">({PANELS[activeChannel].unit})</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={errorSeries} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
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
            <Line
              type="monotone"
              dataKey="value"
              stroke={SERIES_FULL}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
