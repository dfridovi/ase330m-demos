import { useMemo } from 'react';
import { useSimulationStore } from '../../store/simulationStore.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import { TimeSeriesPanel, type TimeSeriesPoint } from './TimeSeriesPanel.tsx';
import { SERIES_FULL } from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;

const LONGITUDINAL_PANELS = [
  { index: 0, title: 'Δu', unit: 'm/s', scale: 1 },
  { index: 1, title: 'α', unit: 'deg', scale: RAD_TO_DEG },
  { index: 2, title: 'q', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 3, title: 'θ', unit: 'deg', scale: RAD_TO_DEG },
];
const LATERAL_PANELS = [
  { index: 0, title: 'β', unit: 'deg', scale: RAD_TO_DEG },
  { index: 1, title: 'p', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 2, title: 'r', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 3, title: 'φ', unit: 'deg', scale: RAD_TO_DEG },
];

export function FullResponseCharts() {
  const activeAxis = useSimulationStore((s) => s.activeAxis);
  const response = useSimulationStore((s) => s.activeResponse());
  const playheadTime = useChartPlayheadTime();
  const panels = activeAxis === 'lateral' ? LATERAL_PANELS : LONGITUDINAL_PANELS;

  const seriesByPanel = useMemo(
    () =>
      panels.map(({ index, scale }) =>
        response.t.map((t, i): TimeSeriesPoint => ({ t, value: response.x[i][index] * scale })),
      ),
    [response, panels],
  );

  return (
    <div className="chart-grid">
      {panels.map((panel, panelIdx) => (
        <TimeSeriesPanel
          key={panel.title}
          title={panel.title}
          unit={panel.unit}
          data={seriesByPanel[panelIdx]}
          color={SERIES_FULL}
          syncId="full-response"
          currentTime={playheadTime === PLAYHEAD_FROZEN ? undefined : playheadTime}
        />
      ))}
    </div>
  );
}
