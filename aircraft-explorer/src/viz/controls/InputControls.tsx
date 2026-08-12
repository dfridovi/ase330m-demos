import { useSimulationStore } from '../../store/simulationStore.ts';
import { Slider } from './Slider.tsx';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

function LongitudinalInputControls() {
  const inputMode = useSimulationStore((s) => s.inputMode);
  const setInputMode = useSimulationStore((s) => s.setInputMode);
  const x0 = useSimulationStore((s) => s.x0);
  const setInitialCondition = useSimulationStore((s) => s.setInitialCondition);
  const elevatorMagnitudeRad = useSimulationStore((s) => s.elevatorMagnitudeRad);
  const setElevatorMagnitudeRad = useSimulationStore((s) => s.setElevatorMagnitudeRad);

  const [du0, alpha0, q0, theta0] = x0;

  return (
    <>
      <div className="input-mode-toggle">
        <button
          type="button"
          className={inputMode === 'freeResponse' ? 'preset-button active' : 'preset-button'}
          onClick={() => setInputMode('freeResponse')}
        >
          Initial condition
        </button>
        <button
          type="button"
          className={inputMode === 'elevatorDoublet' ? 'preset-button active' : 'preset-button'}
          onClick={() => setInputMode('elevatorDoublet')}
        >
          Elevator doublet
        </button>
      </div>

      {inputMode === 'freeResponse' ? (
        <>
          <Slider
            label="Initial Δu"
            unit="m/s"
            value={du0}
            min={-10}
            max={10}
            step={0.1}
            onChange={(v) => setInitialCondition([v, alpha0, q0, theta0])}
          />
          <Slider
            label="Initial α"
            unit="deg"
            value={alpha0 * RAD_TO_DEG}
            min={-10}
            max={10}
            step={0.1}
            onChange={(v) => setInitialCondition([du0, v * DEG_TO_RAD, q0, theta0])}
          />
          <Slider
            label="Initial q"
            unit="deg/s"
            value={q0 * RAD_TO_DEG}
            min={-30}
            max={30}
            step={0.5}
            onChange={(v) => setInitialCondition([du0, alpha0, v * DEG_TO_RAD, theta0])}
          />
          <Slider
            label="Initial θ"
            unit="deg"
            value={theta0 * RAD_TO_DEG}
            min={-10}
            max={10}
            step={0.1}
            onChange={(v) => setInitialCondition([du0, alpha0, q0, v * DEG_TO_RAD])}
          />
          <p className="input-hint">
            Free response from a perturbed trim state — decomposes into short-period and phugoid modes below.
          </p>
        </>
      ) : (
        <>
          <Slider
            label="Elevator doublet magnitude"
            unit="deg"
            value={elevatorMagnitudeRad * RAD_TO_DEG}
            min={0}
            max={10}
            step={0.1}
            onChange={(v) => setElevatorMagnitudeRad(v * DEG_TO_RAD)}
          />
          <p className="input-hint">
            Forced response to a 1s-up / 1s-down elevator doublet starting at t=1s. Modal decomposition isn't shown
            for forced responses — that's covered later in the course via convolution and transfer functions.
          </p>
        </>
      )}
    </>
  );
}

function LateralInputControls() {
  const latX0 = useSimulationStore((s) => s.latX0);
  const setLateralInitialCondition = useSimulationStore((s) => s.setLateralInitialCondition);
  const [beta0, p0, r0, phi0] = latX0;

  return (
    <>
      <Slider
        label="Initial β"
        unit="deg"
        value={beta0 * RAD_TO_DEG}
        min={-10}
        max={10}
        step={0.1}
        onChange={(v) => setLateralInitialCondition([v * DEG_TO_RAD, p0, r0, phi0])}
      />
      <Slider
        label="Initial p"
        unit="deg/s"
        value={p0 * RAD_TO_DEG}
        min={-30}
        max={30}
        step={0.5}
        onChange={(v) => setLateralInitialCondition([beta0, v * DEG_TO_RAD, r0, phi0])}
      />
      <Slider
        label="Initial r"
        unit="deg/s"
        value={r0 * RAD_TO_DEG}
        min={-30}
        max={30}
        step={0.5}
        onChange={(v) => setLateralInitialCondition([beta0, p0, v * DEG_TO_RAD, phi0])}
      />
      <Slider
        label="Initial φ"
        unit="deg"
        value={phi0 * RAD_TO_DEG}
        min={-20}
        max={20}
        step={0.1}
        onChange={(v) => setLateralInitialCondition([beta0, p0, r0, v * DEG_TO_RAD])}
      />
      <p className="input-hint">
        Free response from a perturbed trim state — decomposes into roll subsidence, dutch roll, and spiral modes
        below. Forced response (aileron/rudder doublet) isn't modeled yet for this axis.
      </p>
    </>
  );
}

export function InputControls() {
  const activeAxis = useSimulationStore((s) => s.activeAxis);

  return (
    <fieldset className="input-controls">
      <legend>Input</legend>
      {activeAxis === 'lateral' ? <LateralInputControls /> : <LongitudinalInputControls />}
    </fieldset>
  );
}
