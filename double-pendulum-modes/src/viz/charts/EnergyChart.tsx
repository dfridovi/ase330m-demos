import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePendulumStore } from '../../store/pendulumStore.ts';
import { linearizedEnergy } from '../../core/dynamics/energy.ts';
import { PLAYHEAD_FROZEN, useChartPlayheadTime } from '../useThrottledTime.ts';
import { AXIS, CHART_SURFACE, GRIDLINE, SERIES_KINETIC, SERIES_POTENTIAL, SERIES_TOTAL, TEXT_MUTED, TEXT_PRIMARY } from './theme.ts';

// Below this fraction of peak-to-peak drift relative to the initial total energy, RK4's
// error is small enough that the "Total" line reads as flat on screen — no note needed.
const DRIFT_NOTE_THRESHOLD = 0.005;

export function EnergyChart() {
  const modal = usePendulumStore((s) => s.modal);
  const physicalParams = usePendulumStore((s) => s.physicalParams);
  const playheadTime = useChartPlayheadTime();

  const { data, driftFraction } = useMemo(() => {
    const { t, x } = modal.fullResponse;
    const energies = x.map(([theta1, theta2, theta1dot, theta2dot]) =>
      linearizedEnergy(physicalParams, theta1, theta2, theta1dot, theta2dot),
    );
    const totals = energies.map((e) => e.total);
    const drift = (Math.max(...totals) - Math.min(...totals)) / Math.max(totals[0], 1e-9);
    const data = t.map((time, i) => ({
      t: time,
      Kinetic: energies[i].kinetic,
      Potential: energies[i].potential,
      Total: energies[i].total,
    }));
    return { data, driftFraction: drift };
  }, [modal, physicalParams]);

  return (
    <div className="chart-panel">
      <div className="chart-panel-title">
        Energy (full response) <span className="chart-panel-unit">(J)</span>
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
          <YAxis stroke={AXIS} tick={{ fill: TEXT_MUTED, fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={{ background: CHART_SURFACE, border: `1px solid ${AXIS}`, color: TEXT_PRIMARY }}
            labelFormatter={(t) => `t = ${Number(t).toFixed(2)} s`}
            formatter={(value) => Number(value).toFixed(4)}
          />
          <Legend wrapperStyle={{ color: TEXT_MUTED, fontSize: 12 }} />
          <Line type="monotone" dataKey="Total" stroke={SERIES_TOTAL} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            type="monotone"
            dataKey="Kinetic"
            stroke={SERIES_KINETIC}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Potential"
            stroke={SERIES_POTENTIAL}
            strokeWidth={2}
            strokeDasharray="2 3"
            dot={false}
            isAnimationActive={false}
          />
          {playheadTime !== PLAYHEAD_FROZEN && <ReferenceLine x={playheadTime} stroke={TEXT_MUTED} strokeWidth={1} />}
        </LineChart>
      </ResponsiveContainer>
      {driftFraction > DRIFT_NOTE_THRESHOLD && (
        <p className="chart-note">
          <strong>Why isn't Total perfectly flat?</strong> This linearized system is conservative (frictionless,
          ζ = 0) — its total energy is exactly constant in continuous time. The {(driftFraction * 100).toFixed(2)}%
          peak-to-peak drift you see is <em>numerical integration error</em> from RK4 (not symplectic/energy-preserving),
          accumulating over the simulated time span — not a physical effect.
        </p>
      )}
    </div>
  );
}
