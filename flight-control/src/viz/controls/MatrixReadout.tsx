import { useControlStore } from '../../store/controlStore.ts';
import type { Complex } from '../../core/linalg/eig.ts';

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

function formatEigenvalue(e: Complex): string {
  return `${e.re.toFixed(3)}${e.im !== 0 ? ` ± ${Math.abs(e.im).toFixed(3)}i` : ''}`;
}

export function MatrixReadout() {
  const stateSpace = useControlStore((s) => s.stateSpace);
  const K = useControlStore((s) => s.K);
  const openLoopPoles = useControlStore((s) => s.openLoopPoles);
  const closedLoopPoles = useControlStore((s) => s.closedLoopPoles);

  return (
    <div className="matrix-readout">
      <div className="matrices">
        <MatrixTable label="A" matrix={stateSpace.A} />
        <MatrixTable label="B" matrix={stateSpace.B} />
        <MatrixTable label="K" matrix={[K]} />
      </div>
      <table className="mode-table">
        <thead>
          <tr>
            <th>Open-loop pole</th>
            <th>Closed-loop pole</th>
          </tr>
        </thead>
        <tbody>
          {openLoopPoles.map((pole, i) => (
            <tr key={i}>
              <td>{formatEigenvalue(pole)}</td>
              <td>{formatEigenvalue(closedLoopPoles[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mode-table-note">
        Rows aren't mode-matched (eigenvalue order isn't guaranteed stable under state feedback) — compare the whole
        set, not row-by-row, especially once a pair splits from complex into two real roots or vice versa.
      </p>
    </div>
  );
}
