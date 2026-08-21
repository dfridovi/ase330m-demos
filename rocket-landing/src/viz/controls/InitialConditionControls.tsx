import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';
import { IC_SLIDER_RANGES } from '../../core/constants.ts';
import { Slider } from './Slider.tsx';

export function InitialConditionControls() {
  const theta0 = useRocketLandingStore((s) => s.theta0);
  const vy0 = useRocketLandingStore((s) => s.vy0);
  const px0 = useRocketLandingStore((s) => s.px0);
  const py0 = useRocketLandingStore((s) => s.py0);
  const setTheta0 = useRocketLandingStore((s) => s.setTheta0);
  const setVy0 = useRocketLandingStore((s) => s.setVy0);

  return (
    <fieldset>
      <legend>Initial condition</legend>
      <Slider
        label={
          <>
            Orientation θ<sub>0</sub>
          </>
        }
        unit="rad"
        value={theta0}
        {...IC_SLIDER_RANGES.theta0}
        formatValue={(v) => v.toFixed(2)}
        onChange={setTheta0}
      />
      <Slider
        label={
          <>
            Descent rate v<sub>y0</sub>
          </>
        }
        unit="m/s"
        value={vy0}
        {...IC_SLIDER_RANGES.vy0}
        formatValue={(v) => v.toFixed(1)}
        onChange={setVy0}
      />
      <p className="input-hint">
        Position ({px0.toFixed(0)}, {py0.toFixed(0)}) m -- drag the rocket on the scene to set it.
      </p>
    </fieldset>
  );
}
