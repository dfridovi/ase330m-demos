import { usePendulumStore } from '../../store/pendulumStore.ts';
import { modeShapeRatio } from '../../core/dynamics/modeShape.ts';

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

export function ModeTable() {
  const stateSpace = usePendulumStore((s) => s.stateSpace);
  const modes = usePendulumStore((s) => s.modal.modes);

  return (
    <div className="mode-table-panel">
      <div className="matrices">
        <MatrixTable label="A" matrix={stateSpace.A} />
      </div>
      <table className="mode-table">
        <thead>
          <tr>
            <th>Mode</th>
            <th title="Undamped natural frequency: ωₙ = |λ| = √(Re(λ)² + Im(λ)²).">ωₙ (rad/s)</th>
            <th title="Period of one full oscillation: T = 2π / ωₙ.">Period (s)</th>
            <th title="θ2/θ1 ratio of this mode's eigenvector — its sign tells you whether the two pendulums swing the same way or opposite ways.">
              θ2 / θ1
            </th>
          </tr>
        </thead>
        <tbody>
          {modes.map((mode, i) => {
            const wn = mode.naturalFrequency ?? 0;
            const ratio = modeShapeRatio(stateSpace.A, mode.indices[0]);
            const phase = ratio > 0 ? 'in-phase' : 'anti-phase';
            return (
              <tr key={i}>
                <td>
                  Mode {i + 1} ({phase})
                </td>
                <td>{wn.toFixed(3)}</td>
                <td>{(2 * Math.PI) / wn > 0 ? ((2 * Math.PI) / wn).toFixed(2) : '—'}</td>
                <td>{ratio.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mode-table-note">
        <strong>Why exactly two modes, both undamped?</strong> This is a conservative,
        frictionless linearization (2 degrees of freedom → 2 pairs of purely imaginary
        eigenvalues), so ζ = 0 for both modes always — nothing here ever decays. Mode 1 is
        always the slower, <em>in-phase</em> swing (both pendulums move the same direction);
        Mode 2 is always the faster, <em>anti-phase</em> swing (they move opposite directions).
        Any initial condition you release the pendulum from is just some mixture of these two
        clean oscillations.
      </p>
    </div>
  );
}
