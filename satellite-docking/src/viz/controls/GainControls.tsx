import { useRendezvousStore } from '../../store/rendezvousStore';
import { GAIN_PRESETS } from '../../core/control/gainPresets';

interface GainSpec {
  row: number;
  col: number;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}

// Only the entries either reference gain actually uses (see gainPresets.ts) are exposed:
// each thruster's own position/rate gain, plus the two coupling-cancellation cross terms
// (Kvy feeding ux, Kvx feeding uy) that a "tuned" in-plane design needs to cancel the CW
// equations' Coriolis-like coupling. Position gains are O(1e-5), rate gains O(1e-2) -- ranges
// below are sized around the two presets' values, not a generic +-1 default.
const IN_PLANE_GAINS: GainSpec[] = [
  { row: 0, col: 0, label: 'Kx → ux', hint: '(m/s²)/m', min: 0, max: 1e-4, step: 1e-6 },
  { row: 0, col: 3, label: 'Kvx → ux', hint: '(m/s²)/(m/s)', min: 0, max: 0.05, step: 0.0005 },
  { row: 0, col: 4, label: 'Kvy → ux', hint: '(m/s²)/(m/s), coupling cancellation', min: -0.02, max: 0.02, step: 0.0005 },
  { row: 1, col: 1, label: 'Ky → uy', hint: '(m/s²)/m', min: 0, max: 1e-4, step: 1e-6 },
  { row: 1, col: 3, label: 'Kvx → uy', hint: '(m/s²)/(m/s), coupling cancellation', min: -0.02, max: 0.02, step: 0.0005 },
  { row: 1, col: 4, label: 'Kvy → uy', hint: '(m/s²)/(m/s)', min: 0, max: 0.05, step: 0.0005 },
];

const CROSS_TRACK_GAINS: GainSpec[] = [
  { row: 2, col: 2, label: 'Kz → uz', hint: '(m/s²)/m', min: 0, max: 1e-4, step: 1e-6 },
  { row: 2, col: 5, label: 'Kvz → uz', hint: '(m/s²)/(m/s)', min: 0, max: 0.05, step: 0.0005 },
];

function GainRow({ spec, K, setGain }: { spec: GainSpec; K: number[][]; setGain: (row: number, col: number, value: number) => void }) {
  const { row, col, label, hint, min, max, step } = spec;
  const value = K[row][col];
  return (
    <label className="gain-row" key={`${row}-${col}`}>
      <span className="gain-label">
        {label}
        <span className="gain-hint">{hint}</span>
      </span>
      <input
        type="range"
        className="gain-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setGain(row, col, Number(e.target.value))}
      />
      <input
        type="number"
        className="gain-number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) setGain(row, col, v);
        }}
      />
    </label>
  );
}

export function GainControls() {
  const viewMode = useRendezvousStore((s) => s.viewMode);
  const K = useRendezvousStore((s) => s.K);
  const setGain = useRendezvousStore((s) => s.setGain);
  const activeGainPresetId = useRendezvousStore((s) => s.activeGainPresetId);
  const setGainPreset = useRendezvousStore((s) => s.setGainPreset);

  const activeDescription = GAIN_PRESETS.find((p) => p.id === activeGainPresetId)?.description;

  return (
    <fieldset className="gain-controls">
      <legend>
        Feedback gains K <span className="legend-formula">(u = -K·x, target at the LVLH origin)</span>
      </legend>
      <div className="preset-selector">
        {GAIN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activeGainPresetId === preset.id ? 'preset-button active' : 'preset-button'}
            onClick={() => setGainPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {activeDescription && <p className="input-hint">{activeDescription}</p>}

      {IN_PLANE_GAINS.map((spec) => (
        <GainRow key={`${spec.row}-${spec.col}`} spec={spec} K={K} setGain={setGain} />
      ))}

      {viewMode === '3d' && (
        <>
          <p className="input-hint">Cross-track thruster (uz):</p>
          {CROSS_TRACK_GAINS.map((spec) => (
            <GainRow key={`${spec.row}-${spec.col}`} spec={spec} K={K} setGain={setGain} />
          ))}
        </>
      )}
    </fieldset>
  );
}
