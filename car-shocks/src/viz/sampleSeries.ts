import type { SeriesPoint } from '../core/types/params.ts';

/** Linear interpolation into a uniformly-sampled SeriesPoint[] at time t (clamped to range). */
export function sampleSeriesAt(series: SeriesPoint[], t: number): SeriesPoint {
  if (series.length === 0) return { t: 0, x: 0, xdot: 0, f: 0 };
  const first = series[0];
  const last = series[series.length - 1];
  if (t <= first.t) return first;
  if (t >= last.t) return last;

  let lo = 0;
  let hi = series.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (series[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = series[lo];
  const b = series[hi];
  const frac = (t - a.t) / (b.t - a.t);
  return {
    t,
    x: a.x + frac * (b.x - a.x),
    xdot: a.xdot + frac * (b.xdot - a.xdot),
    f: a.f + frac * (b.f - a.f),
  };
}
