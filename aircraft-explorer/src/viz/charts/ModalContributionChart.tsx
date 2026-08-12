import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSimulationStore } from '../../store/simulationStore.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import { labelLateralModes, labelLongitudinalModes } from '../../core/aero/modeLabels.ts';
import { AIRFRAME_PRESETS, GENERAL_AVIATION } from '../../core/aero/presets.ts';
import {
  AXIS,
  CHART_SURFACE,
  GRIDLINE,
  SERIES_DUTCH_ROLL,
  SERIES_FULL,
  SERIES_PHUGOID,
  SERIES_SHORT_PERIOD,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from './theme.ts';

const RAD_TO_DEG = 180 / Math.PI;
const LONGITUDINAL_STATE_OPTIONS = [
  { index: 0, label: 'Δu', unit: 'm/s', scale: 1 },
  { index: 1, label: 'α', unit: 'deg', scale: RAD_TO_DEG },
  { index: 2, label: 'q', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 3, label: 'θ', unit: 'deg', scale: RAD_TO_DEG },
];
const LATERAL_STATE_OPTIONS = [
  { index: 0, label: 'β', unit: 'deg', scale: RAD_TO_DEG },
  { index: 1, label: 'p', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 2, label: 'r', unit: 'deg/s', scale: RAD_TO_DEG },
  { index: 3, label: 'φ', unit: 'deg', scale: RAD_TO_DEG },
];

const MODE_COLORS: Record<string, string> = {
  'Short Period': SERIES_SHORT_PERIOD,
  Phugoid: SERIES_PHUGOID,
  'Roll Subsidence': SERIES_SHORT_PERIOD,
  'Dutch Roll': SERIES_DUTCH_ROLL,
  Spiral: SERIES_PHUGOID,
};

const MODE_DASH: Record<string, string> = {
  'Short Period': '6 3',
  Phugoid: '2 3',
  'Roll Subsidence': '6 3',
  'Dutch Roll': '4 2',
  Spiral: '2 3',
};

export function ModalContributionChart() {
  const activeAxis = useSimulationStore((s) => s.activeAxis);
  const presetId = useSimulationStore((s) => s.presetId);
  const preset = AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION;
  const defaultStateIndex = activeAxis === 'lateral' ? preset.lateral.defaultChartStateIndex : preset.defaultChartStateIndex;
  const [stateIndex, setStateIndex] = useState<number>(defaultStateIndex);
  // Re-pick the state each preset (and axis) knows shows its slow mode best whenever either
  // changes (alpha/q vs. theta/du, or p/r vs. beta/phi, can differ by orders of magnitude in
  // that mode's amplitude — see AirframePreset.defaultChartStateIndex /
  // AirframePreset.lateral.defaultChartStateIndex), but leave the dropdown free for manual
  // exploration afterward.
  useEffect(() => {
    setStateIndex(defaultStateIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultStateIndex is a pure fn of presetId/activeAxis
  }, [presetId, activeAxis]);
  const modal = useSimulationStore((s) => s.activeModal());
  const playheadTime = useChartPlayheadTime();
  const inputMode = useSimulationStore((s) => s.inputMode);
  const stateOptions = activeAxis === 'lateral' ? LATERAL_STATE_OPTIONS : LONGITUDINAL_STATE_OPTIONS;
  const option = stateOptions.find((o) => o.index === stateIndex) ?? stateOptions[1];
  const labels = activeAxis === 'lateral' ? labelLateralModes(modal.modes) : labelLongitudinalModes(modal.modes);

  const data = useMemo(() => {
    return modal.fullResponse.t.map((t, i) => {
      const point: Record<string, number> = { t, Full: modal.fullResponse.x[i][option.index] * option.scale };
      modal.modeResponses.forEach((response, modeIdx) => {
        point[labels[modeIdx]] = response.x[i][option.index] * option.scale;
      });
      return point;
    });
  }, [modal, option, labels]);

  // Lateral has no forced-response mode yet, so inputMode's stored value is irrelevant there —
  // only longitudinal's elevator-doublet mode disables the modal decomposition.
  if (activeAxis === 'longitudinal' && inputMode !== 'freeResponse') {
    return (
      <div className="chart-panel modal-chart-disabled">
        Modal decomposition is only shown for the free (initial-condition) response.
      </div>
    );
  }

  return (
    <div className="chart-panel modal-chart">
      <div className="chart-panel-title">
        Modal decomposition —{' '}
        <select value={stateIndex} onChange={(e) => setStateIndex(Number(e.target.value))}>
          {stateOptions.map((o) => (
            <option key={o.index} value={o.index}>
              {o.label}
            </option>
          ))}
        </select>{' '}
        <span className="chart-panel-unit">({option.unit})</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
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
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(4)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          <Line type="monotone" dataKey="Full" stroke={SERIES_FULL} strokeWidth={2} dot={false} isAnimationActive={false} />
          {labels.map((label) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={MODE_COLORS[label] ?? TEXT_MUTED}
              strokeWidth={2}
              strokeDasharray={MODE_DASH[label]}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
