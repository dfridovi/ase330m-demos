import { useSimulationStore } from '../../store/simulationStore.ts';
import { labelLateralModes, labelLongitudinalModes } from '../../core/aero/modeLabels.ts';

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
            <th>ωₙ (rad/s)</th>
            <th>ζ</th>
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
    </div>
  );
}
