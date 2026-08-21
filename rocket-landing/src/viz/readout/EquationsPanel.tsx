import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';
import { linearizedStep } from '../../core/mpc/linearize.ts';
import { DT } from '../../core/constants.ts';

function Dot({ children }: { children: string }) {
  return <span className="dot">{children}</span>;
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
                <td key={j}>{value.toFixed(2)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EquationsPanel() {
  const realState = useRocketLandingStore((s) => s.rti.realState);
  const lastAppliedControl = useRocketLandingStore((s) => s.lastAppliedControl);
  const solverConverged = useRocketLandingStore((s) => s.solverConverged);
  const solverIterations = useRocketLandingStore((s) => s.solverIterations);

  const { A, B } = linearizedStep(realState, lastAppliedControl, DT);
  const [T, tau] = lastAppliedControl;

  return (
    <div className="equations-panel">
      <fieldset>
        <legend>Equations of motion</legend>
        <p className="equation-block">
          <Dot>p</Dot>
          <sub>x</sub> = v<sub>x</sub>
          <br />
          <Dot>p</Dot>
          <sub>y</sub> = v<sub>y</sub>
          <br />
          <Dot>θ</Dot> = ω
          <br />
          <Dot>v</Dot>
          <sub>x</sub> = (T/m) sin θ
          <br />
          <Dot>v</Dot>
          <sub>y</sub> = (T/m) cos θ - g
          <br />
          <Dot>ω</Dot> = τ / I
        </p>
        <p className="input-hint">
          Nonlinear because of the sin θ / cos θ coupling between attitude and thrust direction --
          near hover (θ≈0, T≈mg) this reduces to the double-integrator plus attitude dynamics
          seen in the linear state-feedback demos.
        </p>
      </fieldset>

      <fieldset>
        <legend>Cost (per replanned horizon of N steps)</legend>
        <p className="equation-block">
          L<sub>k</sub> = (1/N) {'{'} ½[ q<sub>pos</sub>·|p-p*|² + q<sub>θ</sub>·θ² + q<sub>vel</sub>·|v|² +
          q<sub>ω</sub>·ω² ] + ½[ r<sub>T</sub>·T² + r<sub>τ</sub>·τ² ] {'}'}
          <br />
          L<sub>N</sub> = ρ · ½[ q<sub>pos</sub>·|p-p*|² + q<sub>θ</sub>·θ² + q<sub>vel</sub>·|v|² +
          q<sub>ω</sub>·ω² ]
        </p>
        <p className="input-hint">
          Solved by receding-horizon iLQR: {solverConverged ? 'converged' : 'still improving'} after{' '}
          {solverIterations} iteration{solverIterations === 1 ? '' : 's'} this tick.
        </p>
        <p className="input-hint">
          Two constraints aren't visible in the cost formula above: the actuator limits (dashed
          bounds on the effort chart below) and a soft penalty that discourages the planned
          trajectory from dipping below the pad before touchdown.
        </p>
      </fieldset>

      <fieldset>
        <legend>Current linearization</legend>
        <p className="input-hint">
          The discrete Jacobians (A, B) of the dynamics at the current state and applied control --
          locally, this nonlinear system looks like the LTI plants in the other control demos.
        </p>
        <div className="matrices">
          <MatrixTable label="A (6x6)" matrix={A} />
          <MatrixTable label="B (6x2)" matrix={B} />
        </div>
        <p className="input-hint">
          u* = [T, τ] = [{T.toFixed(0)} N, {tau.toFixed(0)} N·m]
        </p>
      </fieldset>
    </div>
  );
}
