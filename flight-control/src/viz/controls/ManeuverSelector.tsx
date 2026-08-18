import { useControlStore } from '../../store/controlStore.ts';
import type { ManeuverId, SinusoidChannel } from '../../core/control/referenceSignals.ts';
import { Slider } from './Slider.tsx';

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

const MANEUVERS: { id: ManeuverId; label: string }[] = [
  { id: 'trimHold', label: 'Trim hold' },
  { id: 'speedStep', label: 'Speed step' },
  { id: 'pitchStep', label: 'Pitch step' },
  { id: 'sinusoid', label: 'Sinusoidal tracking' },
];

function TrimHoldControls() {
  return (
    <p className="input-hint">
      x<sub>ref</sub> = 0 for all t — pure disturbance rejection from a perturbed trim state. This
      is the direct analogue of the free-response phugoid: with K = 0 you'll see the same undamped
      oscillation as in the modal-decomposition demo.
    </p>
  );
}

function SpeedStepControls() {
  const speedStepMagnitude = useControlStore((s) => s.speedStepMagnitude);
  const setSpeedStepMagnitude = useControlStore((s) => s.setSpeedStepMagnitude);
  return (
    <>
      <Slider
        label="Commanded Δu"
        unit="m/s"
        value={speedStepMagnitude}
        min={-10}
        max={10}
        step={0.5}
        onChange={setSpeedStepMagnitude}
      />
      <p className="input-hint">
        Δu<sub>ref</sub> steps to this value at t=2s, all other reference channels stay at 0. Watch
        for a nonzero steady-state offset — pure state feedback has no integral action.
      </p>
    </>
  );
}

function PitchStepControls() {
  const pitchStepMagnitude = useControlStore((s) => s.pitchStepMagnitude);
  const setPitchStepMagnitude = useControlStore((s) => s.setPitchStepMagnitude);
  return (
    <>
      <Slider
        label="Commanded θ"
        unit="deg"
        value={pitchStepMagnitude * RAD_TO_DEG}
        min={-15}
        max={15}
        step={0.5}
        onChange={(v) => setPitchStepMagnitude(v * DEG_TO_RAD)}
      />
      <p className="input-hint">
        θ<sub>ref</sub> steps to this value at t=2s (a simplified climb command), all other
        reference channels stay at 0.
      </p>
    </>
  );
}

function SinusoidControls() {
  const sinusoidChannel = useControlStore((s) => s.sinusoidChannel);
  const setSinusoidChannel = useControlStore((s) => s.setSinusoidChannel);
  const sinusoidAmplitude = useControlStore((s) => s.sinusoidAmplitude);
  const setSinusoidAmplitude = useControlStore((s) => s.setSinusoidAmplitude);
  const sinusoidOmega = useControlStore((s) => s.sinusoidOmega);
  const setSinusoidOmega = useControlStore((s) => s.setSinusoidOmega);

  const isTheta = sinusoidChannel === 'theta';

  return (
    <>
      <div className="input-mode-toggle">
        {(['du', 'theta'] as SinusoidChannel[]).map((channel) => (
          <button
            key={channel}
            type="button"
            className={sinusoidChannel === channel ? 'preset-button active' : 'preset-button'}
            onClick={() => setSinusoidChannel(channel)}
          >
            {channel === 'du' ? 'Δu' : 'θ'}
          </button>
        ))}
      </div>
      <Slider
        label="Amplitude"
        unit={isTheta ? 'deg' : 'm/s'}
        value={isTheta ? sinusoidAmplitude * RAD_TO_DEG : sinusoidAmplitude}
        min={isTheta ? 0.5 : 0.2}
        max={isTheta ? 15 : 10}
        step={isTheta ? 0.5 : 0.2}
        onChange={(v) => setSinusoidAmplitude(isTheta ? v * DEG_TO_RAD : v)}
      />
      <Slider
        label="Frequency ω"
        unit="rad/s"
        value={sinusoidOmega}
        min={0.02}
        max={2}
        step={0.01}
        onChange={setSinusoidOmega}
      />
      <p className="input-hint">
        This is also the reference signal swept on the frequency-response chart — drag ω here and
        watch the marker move along the Bode curves.
      </p>
    </>
  );
}

export function ManeuverSelector() {
  const maneuver = useControlStore((s) => s.maneuver);
  const setManeuver = useControlStore((s) => s.setManeuver);

  return (
    <fieldset className="maneuver-selector">
      <legend>
        Reference maneuver{' '}
        <span className="legend-formula">
          x<sub>ref</sub>(t)
        </span>
      </legend>
      <div className="preset-selector">
        {MANEUVERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={maneuver === id ? 'preset-button active' : 'preset-button'}
            onClick={() => setManeuver(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {maneuver === 'trimHold' && <TrimHoldControls />}
      {maneuver === 'speedStep' && <SpeedStepControls />}
      {maneuver === 'pitchStep' && <PitchStepControls />}
      {maneuver === 'sinusoid' && <SinusoidControls />}
    </fieldset>
  );
}
