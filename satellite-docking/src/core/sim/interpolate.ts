import type { Trajectory, Vector } from './rk4.ts';

/**
 * Linearly interpolates a fixed-step trajectory at an arbitrary time (clamped to the
 * trajectory's span -- past a divergence-truncated end, this holds the last pre-divergence
 * state rather than extrapolating). Pass `out` to write into an existing array instead of
 * allocating a new one -- called every animation frame from the 3D/2D scenes.
 */
export function sampleTrajectory(trajectory: Trajectory, t: number, out?: Vector): Vector {
  const { t: times, x } = trajectory;
  const n = times.length;

  const writeInto = (source: Vector): Vector => {
    if (!out) return source;
    for (let k = 0; k < source.length; k++) out[k] = source[k];
    return out;
  };

  if (t <= times[0]) return writeInto(x[0]);
  if (t >= times[n - 1]) return writeInto(x[n - 1]);

  const dt = times[1] - times[0];
  const rawIndex = (t - times[0]) / dt;
  const i0 = Math.min(n - 2, Math.floor(rawIndex));
  const frac = rawIndex - i0;
  const a = x[i0];
  const b = x[i0 + 1];
  const target = out ?? new Array(a.length);
  for (let k = 0; k < a.length; k++) target[k] = a[k] + (b[k] - a[k]) * frac;
  return target;
}

/**
 * Same clamped-linear-interpolation idea as sampleTrajectory, for a plain scalar series (e.g.
 * distance-to-target or cumulative effort) instead of a state vector -- used to align the
 * current-gain series onto the naive/tuned reference gains' time grid in the effort comparison
 * chart, since a very aggressive custom K can trigger a finer/shorter RK4 step than the fixed
 * reference gains (see closedLoopSim.ts's stableStepSize). Holding flat past a series' own end
 * is the right behavior for both quantities: cumulative effort stops accruing once the sim
 * stops, and a diverged distance-to-target staying flat still reads as "never recovered".
 */
export function sampleSeries(times: number[], values: number[], t: number): number {
  const n = times.length;
  if (t <= times[0]) return values[0];
  if (t >= times[n - 1]) return values[n - 1];

  const dt = times[1] - times[0];
  const rawIndex = (t - times[0]) / dt;
  const i0 = Math.min(n - 2, Math.floor(rawIndex));
  const frac = rawIndex - i0;
  return values[i0] + (values[i0 + 1] - values[i0]) * frac;
}
