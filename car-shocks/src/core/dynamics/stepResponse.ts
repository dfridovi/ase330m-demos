import type { CarParams, SeriesPoint } from '../types/params.ts';
import { getModalParams } from './quarterCar.ts';

// Step forcing f(t) = f0 * u(t), z(0) = 0. Underdamped closed form:
// x(t) = (f0/k) [ 1 - e^{sigma t} ( cos(omegaD t) - (sigma/omegaD) sin(omegaD t) ) ]
export function stepResponse(t: number, params: CarParams & { f0: number }): number {
  const { k, f0 } = params;
  const { sigma, omegaD } = getModalParams(params);
  const envelope = Math.exp(sigma * t);
  const bracket =
    Math.cos(omegaD * t) - (sigma / omegaD) * Math.sin(omegaD * t);
  return (f0 / k) * (1 - envelope * bracket);
}

// Differentiating stepResponse and using sigma^2 + omegaD^2 = k/m collapses to:
// ẋ(t) = (f0 / (m omegaD)) e^{sigma t} sin(omegaD t)
export function stepResponseVelocity(
  t: number,
  params: CarParams & { f0: number },
): number {
  const { m, f0 } = params;
  const { sigma, omegaD } = getModalParams(params);
  return (f0 / (m * omegaD)) * Math.exp(sigma * t) * Math.sin(omegaD * t);
}

export function stepResponseSeries(
  params: CarParams & { f0: number },
  tEnd: number,
  n: number,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = (tEnd * i) / (n - 1);
    points.push({
      t,
      x: stepResponse(t, params),
      xdot: stepResponseVelocity(t, params),
      f: params.f0,
    });
  }
  return points;
}
