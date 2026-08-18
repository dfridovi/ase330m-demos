import type { Vector } from '../sim/rk4.ts';

/** Full-state reference signal x_ref(t), same shape as the longitudinal state
 * [du, alpha, q, theta]. Only one component is ever nonzero at a time in the maneuvers below —
 * alpha and q have no independent "commanded value" a pilot would set directly, so tracking
 * error in those channels during a du/theta maneuver reflects the airframe's own coupling,
 * not a missing reference. */
export type ReferenceSignal = (t: number) => Vector;

export type ManeuverId = 'trimHold' | 'speedStep' | 'pitchStep' | 'sinusoid';
export type SinusoidChannel = 'du' | 'theta';

/** x_ref = 0 for all t: the pure regulator/disturbance-rejection case, driven instead by a
 * nonzero initial condition (see AirframePreset.disturbanceX0). */
export function trimHoldReference(): ReferenceSignal {
  return () => [0, 0, 0, 0];
}

/** Commanded step change in trim speed (du), holding after startTime. */
export function speedStepReference(magnitude: number, startTime: number): ReferenceSignal {
  return (t: number) => [t >= startTime ? magnitude : 0, 0, 0, 0];
}

/** Commanded step change in pitch attitude (theta) -- a simplified "climb command". */
export function pitchStepReference(magnitude: number, startTime: number): ReferenceSignal {
  return (t: number) => [0, 0, 0, t >= startTime ? magnitude : 0];
}

/** Sinusoidal reference in a single channel, amplitude * sin(omega * t) -- also the signal
 * whose omega is swept for the frequency-response chart. */
export function sinusoidReference(channel: SinusoidChannel, amplitude: number, omega: number): ReferenceSignal {
  const index = channel === 'du' ? 0 : 3;
  return (t: number) => {
    const xRef: Vector = [0, 0, 0, 0];
    xRef[index] = amplitude * Math.sin(omega * t);
    return xRef;
  };
}
