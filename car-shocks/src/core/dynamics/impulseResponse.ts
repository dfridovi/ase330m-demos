import type { CarParams, SeriesPoint } from '../types/params.ts';
import { getModalParams } from './quarterCar.ts';

// Impulse forcing f(t) = I * delta(t), equivalent to z(0) = [0, I/m].
// x(t) = (I / (m omegaD)) e^{sigma t} sin(omegaD t)
export function impulseResponse(t: number, params: CarParams & { I: number }): number {
  const { m, I } = params;
  const { sigma, omegaD } = getModalParams(params);
  return (I / (m * omegaD)) * Math.exp(sigma * t) * Math.sin(omegaD * t);
}

// ẋ(t) = (I / (m omegaD)) e^{sigma t} [ sigma sin(omegaD t) + omegaD cos(omegaD t) ]
export function impulseResponseVelocity(
  t: number,
  params: CarParams & { I: number },
): number {
  const { m, I } = params;
  const { sigma, omegaD } = getModalParams(params);
  const envelope = Math.exp(sigma * t);
  return (
    (I / (m * omegaD)) *
    envelope *
    (sigma * Math.sin(omegaD * t) + omegaD * Math.cos(omegaD * t))
  );
}

export function impulseResponseSeries(
  params: CarParams & { I: number },
  tEnd: number,
  n: number,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (let i = 0; i < n; i++) {
    const t = (tEnd * i) / (n - 1);
    points.push({
      t,
      x: impulseResponse(t, params),
      xdot: impulseResponseVelocity(t, params),
      // See the SeriesPoint.f doc comment: the impulse itself is instantaneous, not a
      // sampleable force-vs-time value, so this stays 0 for the whole series.
      f: 0,
    });
  }
  return points;
}
