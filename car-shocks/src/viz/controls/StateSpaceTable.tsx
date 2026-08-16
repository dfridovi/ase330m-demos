import { useCarShocksStore } from '../../store/carShocksStore.ts';

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

export function StateSpaceTable() {
  const { A, B } = useCarShocksStore((s) => s.stateSpace);
  const sigma = useCarShocksStore((s) => s.sigma);
  const omegaD = useCarShocksStore((s) => s.omegaD);
  const isOverdamped = useCarShocksStore((s) => s.isOverdamped);

  return (
    <div className="mode-table-panel">
      <div className="matrices">
        <MatrixTable label="A" matrix={A} />
        <MatrixTable label="B" matrix={[[B[0]], [B[1]]]} />
      </div>
      <table className="mode-table">
        <thead>
          <tr>
            <th>Eigenvalues of A</th>
            <th title="Real part — exponential decay rate of the free response.">σ</th>
            <th title="Imaginary part — damped oscillation frequency.">ω_d</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>σ ± iω_d</td>
            <td>{sigma.toFixed(3)} 1/s</td>
            <td>{isOverdamped ? '— (overdamped)' : `${omegaD.toFixed(3)} rad/s`}</td>
          </tr>
        </tbody>
      </table>
      <p className="mode-table-note">
        <strong>Two equivalent routes to the same transfer function:</strong> writing the equation
        of motion <em>m·ẍ + c·ẋ + k·x = f(t)</em> as <em>ż = Az + Bf(t)</em> and reading off{' '}
        <em>C(iωI − A)⁻¹B</em> (with <em>C = [1, 0]</em>) gives the same steady-state transfer
        function as substituting <em>f(t) = f₀·sin(ωt)</em>, <em>x(t) = X·sin(ωt − φ)</em> directly
        into the second-order equation: <em>X(iω)/F(iω) = 1 / (k − mω² + icω)</em>. Both routes
        land on the same amplitude <em>X(ω) = f₀/√((k−mω²)² + (cω)²)</em> and phase{' '}
        <em>φ(ω) = atan2(cω, k−mω²)</em>.
      </p>
      <p className="mode-table-note">
        <strong>σ and ω_d</strong> come directly from <em>A</em>'s eigenvalues (roots of{' '}
        <em>λ² + (c/m)λ + k/m = 0</em>): <em>σ = −c/(2m)</em> is the real part — how fast the free
        bounce dies out — and <em>ω_d = √(k/m − σ²)</em> is the imaginary part — the frequency the
        car actually bounces at. The step and impulse responses shown below are both an{' '}
        <em>e^(σt)</em> envelope around oscillation at <em>ω_d</em>.
      </p>
    </div>
  );
}
