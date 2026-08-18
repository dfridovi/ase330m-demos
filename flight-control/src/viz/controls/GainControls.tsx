import { useControlStore } from '../../store/controlStore.ts';

interface GainSpec {
  index: number;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}

// K multiplies the state error [du, alpha, q, theta] to produce a scalar elevator deflection
// (rad). All four columns feed back mainly through B's dominant q-row entry (Mdeltae' ~ -36),
// so every channel is far more sensitive than a naive +-5/+-10 range suggested — e.g. K_q alone
// crosses from stable to a fast-growing instability between +0.1 and +0.3. Ranges below were
// picked by probing eig(A-BK) channel-by-channel so the full slider stays inside "interesting"
// territory (both the stabilizing region and the nearby instability boundary) instead of
// mostly being unreachable dead zone: K_du is stable only in a razor-thin +-0.03 sliver either
// side of 0, K_theta destabilizes at any positive value, K_alpha and K_q tolerate a wider
// negative range but still turn unstable well before their old +-5/+-10 extremes.
const GAINS: GainSpec[] = [
  { index: 0, label: 'K_Δu', hint: 'rad / (m/s)', min: -0.05, max: 0.05, step: 0.002 },
  { index: 1, label: 'K_α', hint: 'rad / rad', min: -1, max: 0.4, step: 0.02 },
  { index: 2, label: 'K_q', hint: 'rad / (rad/s)', min: -1, max: 0.15, step: 0.01 },
  { index: 3, label: 'K_θ', hint: 'rad / rad', min: -0.5, max: 0.08, step: 0.005 },
];

export function GainControls() {
  const K = useControlStore((s) => s.K);
  const setGain = useControlStore((s) => s.setGain);

  return (
    <fieldset className="gain-controls">
      <legend>
        Feedback gains K{' '}
        <span className="legend-formula">
          (u = -K·(x - x<sub>ref</sub>))
        </span>
      </legend>
      {GAINS.map(({ index, label, hint, min, max, step }) => (
        <label className="gain-row" key={index}>
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
            value={K[index]}
            onChange={(e) => setGain(index, Number(e.target.value))}
          />
          <input
            type="number"
            className="gain-number"
            min={min}
            max={max}
            step={step}
            value={K[index]}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (Number.isFinite(value)) setGain(index, value);
            }}
          />
        </label>
      ))}
      <p className="input-hint">
        This system is more sensitive than it looks — small gains move the poles a lot, and for most of these
        channels negative values damp the phugoid while positive values destabilize it quickly. The ranges above
        are narrowed to keep you near the interesting (and stable) region; watch the pole/zero map as you adjust.
      </p>
    </fieldset>
  );
}
