import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';
import { WEIGHT_SLIDER_RANGES } from '../../core/constants.ts';
import { Slider } from './Slider.tsx';

export function CostWeightControls() {
  const weights = useRocketLandingStore((s) => s.weights);
  const setWeight = useRocketLandingStore((s) => s.setWeight);

  return (
    <fieldset>
      <legend>Cost weights</legend>
      <Slider
        label={
          <>
            Position q<sub>pos</sub>
          </>
        }
        value={weights.qPos}
        {...WEIGHT_SLIDER_RANGES.qPos}
        onChange={(v) => setWeight('qPos', v)}
      />
      <Slider
        label={
          <>
            Attitude q<sub>θ</sub>
          </>
        }
        value={weights.qTheta}
        {...WEIGHT_SLIDER_RANGES.qTheta}
        onChange={(v) => setWeight('qTheta', v)}
      />
      <Slider
        label={
          <>
            Velocity q<sub>vel</sub>
          </>
        }
        value={weights.qVel}
        {...WEIGHT_SLIDER_RANGES.qVel}
        onChange={(v) => setWeight('qVel', v)}
      />
      <Slider
        label={
          <>
            Angular rate q<sub>ω</sub>
          </>
        }
        value={weights.qOmega}
        {...WEIGHT_SLIDER_RANGES.qOmega}
        onChange={(v) => setWeight('qOmega', v)}
      />
      <Slider
        label={
          <>
            Thrust effort r<sub>T</sub>
          </>
        }
        value={weights.rThrust}
        {...WEIGHT_SLIDER_RANGES.rThrust}
        formatValue={(v) => v.toExponential(1)}
        onChange={(v) => setWeight('rThrust', v)}
      />
      <Slider
        label={
          <>
            Torque effort r<sub>τ</sub>
          </>
        }
        value={weights.rTorque}
        {...WEIGHT_SLIDER_RANGES.rTorque}
        formatValue={(v) => v.toExponential(1)}
        onChange={(v) => setWeight('rTorque', v)}
      />
      <Slider
        label="Terminal scale ρ"
        value={weights.terminalScale}
        {...WEIGHT_SLIDER_RANGES.terminalScale}
        onChange={(v) => setWeight('terminalScale', v)}
      />
      <p className="input-hint">
        Weights apply on the next replanned horizon -- no need to pause. Push one too far and
        watch the landing get worse (or fail) in real time.
      </p>
    </fieldset>
  );
}
