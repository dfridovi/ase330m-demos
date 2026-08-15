import { decompose, propagate } from '../dynamics/cw';
import type { RelativeState } from '../types/orbit';

export interface TimeSeries {
  t: number[];
  full: RelativeState[];
  drift: RelativeState[];
  inPlane: RelativeState[];
  crossTrack: RelativeState[];
}

// Samples the closed-form CW solution (and its modal decomposition) uniformly over
// [0, durationSec].
export function generateTimeSeries(
  state0: RelativeState,
  n: number,
  durationSec: number,
  numSamples: number,
): TimeSeries {
  const t: number[] = [];
  const full: RelativeState[] = [];
  const drift: RelativeState[] = [];
  const inPlane: RelativeState[] = [];
  const crossTrack: RelativeState[] = [];

  for (let i = 0; i < numSamples; i++) {
    const ti = (i / (numSamples - 1)) * durationSec;
    const parts = decompose(state0, n, ti);
    t.push(ti);
    full.push(propagate(state0, n, ti));
    drift.push(parts.drift);
    inPlane.push(parts.inPlane);
    crossTrack.push(parts.crossTrack);
  }

  return { t, full, drift, inPlane, crossTrack };
}

export function captureDistance(state: RelativeState): number {
  return Math.sqrt(state.x * state.x + state.y * state.y + state.z * state.z);
}
