import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSimulationStore } from '../../store/simulationStore.ts';
import { labelLateralModes, labelLongitudinalModes } from '../../core/aero/modeLabels.ts';

// Renders via a portal to <body> instead of a CSS ::after: the mode table lives in
// .right-panel, which needs overflow-y: auto for its own scrolling, and that (per the CSS
// spec) forces overflow-x: auto too — clipping any tooltip that tries to bleed past the
// panel's left edge to overlap the 3D viz. A portal escapes that clipping and the WebGL
// canvas's own stacking context entirely, positioned from the header's live screen rect.
function TooltipHeader({ text, children }: { text: string; children: ReactNode }) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [anchor, setAnchor] = useState<{ bottom: number; right: number } | null>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setAnchor({ bottom: window.innerHeight - rect.top + 6, right: window.innerWidth - rect.right });
    }
  };

  return (
    <th ref={ref} className="has-tooltip" onMouseEnter={show} onMouseLeave={() => setAnchor(null)}>
      {children}
      {anchor &&
        createPortal(
          <div className="header-tooltip" style={{ bottom: anchor.bottom, right: anchor.right }}>
            {text}
          </div>,
          document.body,
        )}
    </th>
  );
}

function MatrixTable({ label, matrix }: { label: string; matrix: number[][] }) {
  return (
    <div className="matrix-table">
      <div className="matrix-label">{label}</div>
      <table>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td key={j}>{value.toFixed(3)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MatrixReadout() {
  const activeAxis = useSimulationStore((s) => s.activeAxis);
  const stateSpace = useSimulationStore((s) => s.activeStateSpace());
  const modes = useSimulationStore((s) => s.activeModal().modes);
  const labels = activeAxis === 'lateral' ? labelLateralModes(modes) : labelLongitudinalModes(modes);
  const hasOscillatoryMode = modes.some((mode) => mode.naturalFrequency !== undefined);
  // Longitudinal normally splits into two oscillatory pairs (short-period, phugoid) because
  // pitch stiffness (-Cm_alpha) decouples fast alpha/q dynamics from slow u/theta dynamics.
  // Near/past the neutral point that stiffness vanishes, and — verified numerically while
  // scanning cgShiftFraction — the short-period pair collapses to real roots first, then the
  // phugoid pair collapses too right as Cm_alpha crosses zero, leaving all 4 eigenvalues real.
  const allModesReal = activeAxis === 'longitudinal' && modes.length > 0 && !hasOscillatoryMode;

  return (
    <div className="matrix-readout">
      <div className="matrices">
        <MatrixTable label="A" matrix={stateSpace.A} />
        <MatrixTable label="B" matrix={stateSpace.B} />
      </div>
      <table className="mode-table">
        <thead>
          <tr>
            <th>Mode</th>
            <th>Eigenvalue</th>
            <TooltipHeader text="Natural frequency: the oscillation rate this mode would have if undamped. ωₙ = |λ| = √(Re(λ)² + Im(λ)²), where λ is this mode's eigenvalue.">
              ωₙ (rad/s)
            </TooltipHeader>
            <TooltipHeader text="Damping ratio: how quickly the oscillation decays relative to critical damping (0 = undamped, 1 = no oscillation). ζ = −Re(λ) / ωₙ.">
              ζ
            </TooltipHeader>
          </tr>
        </thead>
        <tbody>
          {modes.map((mode, i) => (
            <tr key={labels[i]}>
              <td>{labels[i]}</td>
              <td>
                {mode.eigenvalues[0].re.toFixed(3)}
                {mode.eigenvalues[0].im !== 0
                  ? ` ± ${Math.abs(mode.eigenvalues[0].im).toFixed(3)}i`
                  : ''}
              </td>
              <td>{mode.naturalFrequency !== undefined ? mode.naturalFrequency.toFixed(3) : '—'}</td>
              <td>{mode.dampingRatio !== undefined ? mode.dampingRatio.toFixed(3) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasOscillatoryMode && (
        <p className="mode-table-note">
          <strong>Note:</strong> ωₙ is the <em>undamped</em> natural frequency — matching
          λ = −ζωₙ ± iωₙ√(1−ζ²) to a mode's eigenvalue λ = Re(λ) + i·Im(λ) gives ωₙ = |λ| and
          ζ = −Re(λ) / ωₙ. The frequency you actually see oscillating in the response plots is
          the <em>damped</em> natural frequency, Im(λ) = ωₙ√(1−ζ²) — always ≤ ωₙ, equal only
          when ζ = 0.
        </p>
      )}
      {allModesReal && (
        <p className="mode-table-note mode-table-warning">
          <strong>Why 4 real modes?</strong> Longitudinal dynamics normally split into two
          oscillatory pairs — short-period (fast, in α and q) and phugoid (slow, in u and θ) —
          because pitch stiffness (−Cm<sub>α</sub>, i.e. positive static margin) acts like a
          restoring spring holding α's oscillation apart from the slower speed/attitude
          exchange. Moving the CG aft weakens that spring: as Cm<sub>α</sub> rises toward zero,
          the short-period pair collapses into two real roots first, and the phugoid pair
          collapses too right as Cm<sub>α</sub> crosses zero. What used to be the phugoid's slow
          oscillation splits into a stable root and an unstable one — that lone unstable real
          root, not a full complex pair, is what makes α and θ grow instead of oscillate.
        </p>
      )}
    </div>
  );
}
