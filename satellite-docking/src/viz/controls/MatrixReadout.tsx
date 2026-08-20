import { useRendezvousStore } from '../../store/rendezvousStore';
import type { Complex } from '../../core/linalg/eig';

function MatrixTable({ label, matrix }: { label: string; matrix: number[][] }) {
  return (
    <div className="matrix-table">
      <div className="matrix-label">{label}</div>
      <table>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td key={j}>{value.toExponential(1)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatEigenvalue(e: Complex): string {
  return `${e.re.toExponential(2)}${e.im !== 0 ? ` ± ${Math.abs(e.im).toExponential(2)}i` : ''}`;
}

export function MatrixReadout() {
  const K = useRendezvousStore((s) => s.K);
  const openLoopPoles = useRendezvousStore((s) => s.openLoopPoles);
  const closedLoopPoles = useRendezvousStore((s) => s.closedLoopPoles);

  return (
    <div className="matrix-readout">
      <div className="matrices">
        <MatrixTable label="K (rows: ux, uy, uz)" matrix={K} />
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
        Every open-loop pole has zero real part -- a repeated zero eigenvalue plus two
        oscillatory pairs at the orbital rate n -- but the system is unstable anyway: the
        repeated zero comes from a single 2x2 Jordan block rather than two independent
        eigenvectors, and that block makes the along-track state grow linearly and without
        bound. Pole location alone doesn't tell you this; state feedback has to fix it.
        Rows aren't mode-matched (eigenvalue order isn't guaranteed stable under state feedback)
        -- compare the whole set, not row-by-row.
      </p>
    </div>
  );
}
