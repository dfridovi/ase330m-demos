import type { Trajectory, Vector } from './rk4.ts';

/**
 * Linearly interpolates a fixed-step trajectory at an arbitrary time (clamped to the
 * trajectory's span). Pass `out` to write into an existing array instead of allocating a new
 * one — this is called every animation frame from the 3D scene, and `.map()` there would
 * allocate a fresh array 60+ times a second, adding avoidable GC pressure to the hot path.
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
