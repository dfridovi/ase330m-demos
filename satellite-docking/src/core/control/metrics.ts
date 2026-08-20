import type { Trajectory } from '../sim/rk4.ts';

/** Distance from the chief (LVLH origin) at each trajectory sample -- state order [x,y,z,...]. */
export function distanceSeries(trajectory: Trajectory): number[] {
  return trajectory.x.map((state) => Math.hypot(state[0], state[1], state[2]));
}

/**
 * First time the chaser is within thresholdM of the chief AND stays within it for the rest of
 * the run (a fleeting pass-through on the way to a wider oscillation doesn't count as
 * "captured"). Returns null if it never sustains capture before the trajectory ends.
 */
export function timeToCapture(times: number[], distances: number[], thresholdM: number): number | null {
  let lastOutside = -1;
  for (let i = distances.length - 1; i >= 0; i--) {
    if (distances[i] >= thresholdM) {
      lastOutside = i;
      break;
    }
  }
  if (lastOutside === distances.length - 1) return null; // still outside at the very end
  return times[lastOutside + 1];
}
