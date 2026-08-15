import { useCwStore } from '../../store/cwStore';
import { secularDriftRate, stateSpaceMatrix } from '../../core/dynamics/cw';

function MatrixTable({ label, matrix }: { label: string; matrix: number[][] }) {
  return (
    <div className="matrix-table">
      <div className="matrix-label">{label}</div>
      <table>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((value, j) => (
                <td key={j}>{value.toExponential(2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DRIFT_TOLERANCE = 1e-6; // m/s

export function ModeTable() {
  const n = useCwStore((s) => s.n);
  const period = useCwStore((s) => s.period);
  const x0 = useCwStore((s) => s.x0);

  const A = stateSpaceMatrix(n);
  const driftRate = secularDriftRate(x0, n);
  const isClosed = Math.abs(driftRate) < DRIFT_TOLERANCE;

  return (
    <div className="mode-table-panel">
      <div className="matrices">
        <MatrixTable label="A" matrix={A} />
      </div>
      <table className="mode-table">
        <thead>
          <tr>
            <th>Mode</th>
            <th title="Eigenvalue(s) of the linearized A matrix spanning this mode.">λ</th>
            <th title="Period of one full oscillation: T = 2π / n. Not applicable to the non-oscillatory drift mode.">
              Period
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Drift (secular)</td>
            <td>0, 0 (Jordan block)</td>
            <td>—</td>
          </tr>
          <tr>
            <td>In-plane oscillation</td>
            <td>±{n.toExponential(2)}i</td>
            <td>{(period / 60).toFixed(1)} min</td>
          </tr>
          <tr>
            <td>Cross-track oscillation</td>
            <td>±{n.toExponential(2)}i</td>
            <td>{(period / 60).toFixed(1)} min</td>
          </tr>
        </tbody>
      </table>
      <p className="mode-table-note">
        <strong>How this compares to the other two demos:</strong> the aircraft demo's
        short-period/phugoid (longitudinal) and dutch-roll/roll-subsidence/spiral (lateral) modes,
        and the double-pendulum's slow in-phase and fast anti-phase swings, are all genuinely
        distinct oscillatory or exponential modes at different frequencies. There's no such split
        here. The in-plane subsystem's <em>λ=0</em> eigenvalue is instead a repeated root captured
        by a single 2x2 Jordan block, not two independent eigenvectors. In the matrix exponential{' '}
        <em>exp(At)</em>, a repeated eigenvalue inside a Jordan block contributes a term{' '}
        <em>t·exp(λt)</em> in addition to the usual <em>exp(λt)</em> — for <em>λ=0</em> that term
        is just <em>t·exp(0) = t</em>, the along-track drift growing linearly in time. Both
        genuinely oscillatory modes here run at the <em>same</em> frequency <em>n</em> (the
        chief's mean motion), one confined to the orbital plane and one fully decoupled from it.
      </p>
      <p className="mode-table-note">
        <strong>This is a genuine instability, not just a lack of periodicity:</strong> every
        eigenvalue of <em>A</em> has zero real part — none in the right half-plane — so checking
        eigenvalue locations alone would call this system stable. It isn't. The <em>λ=0</em>{' '}
        Jordan block means that for almost any initial condition the along-track state grows
        without bound (linearly, not exponentially) instead of staying put or decaying — exactly
        what the trajectory flying off-screen in the 3D view is showing. Eigenvalue location
        isn't enough to conclude stability; diagonalizability matters too. A repeated eigenvalue
        on the imaginary axis (<em>λ=0</em> included) that sits in a Jordan block makes the system
        internally unstable, even though nothing here blows up exponentially.
      </p>
      <p className="mode-table-note">
        <strong>Current along-track drift rate:</strong> {(driftRate * 3600).toFixed(2)} m/hr.{' '}
        {isClosed
          ? 'Zero — this relative orbit is closed and repeats every period.'
          : 'Non-zero — the ellipse center drifts steadily along-track, orbit after orbit.'}
      </p>
      <p className="mode-table-note">
        <strong>Why this looks "resonant" even though nothing is forcing it:</strong> a repeated
        root is a repeated root, regardless of where it shows up. Force a lightly-damped
        oscillator exactly at its natural frequency and the classic secular response
        <em> t·sin(ωt)</em> appears because the forcing frequency collides with the system's own
        pole, turning a simple pole into a repeated one. Here, the collision is built into the
        free dynamics themselves — the radial/along-track coupling makes <em>λ=0</em> a repeated
        pole with no forcing required — but the signature is identical: a term that grows
        linearly in <em>t</em> instead of settling into a bounded oscillation. The drift curve in
        the chart above is that term.
      </p>
    </div>
  );
}
