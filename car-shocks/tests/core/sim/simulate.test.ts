import { describe, expect, it } from 'vitest';
import { simulatePeriodicResponse } from '../../../src/core/sim/simulate.ts';
import {
  steadyStateAmplitude,
  steadyStatePhase,
} from '../../../src/core/dynamics/frequencyResponse.ts';
import { getModalParams } from '../../../src/core/dynamics/quarterCar.ts';

const SAMPLES = [
  { m: 300, k: 20000, c: 1500, f0: 500, omega: 6 },
  { m: 150, k: 5000, c: 100, f0: 200, omega: 4 },
  { m: 600, k: 50000, c: 1700, f0: 1000, omega: 10 },
];

describe('simulatePeriodicResponse', () => {
  it('starts at rest', () => {
    for (const params of SAMPLES) {
      const series = simulatePeriodicResponse(params, 10, 2000);
      expect(series[0].x).toBe(0);
      expect(series[0].xdot).toBe(0);
    }
  });

  it('records the applied force f0*sin(omega*t) alongside each sampled point', () => {
    for (const params of SAMPLES) {
      const series = simulatePeriodicResponse(params, 10, 500);
      for (const p of series) {
        expect(p.f).toBeCloseTo(params.f0 * Math.sin(params.omega * p.t), 8);
      }
    }
  });

  it('converges to the closed-form steady-state amplitude/phase once the transient decays', () => {
    for (const params of SAMPLES) {
      const { sigma } = getModalParams(params);
      // Let the e^{sigma t} transient decay to a negligible fraction, then sample the
      // last several periods and fit sinusoid amplitude via peak detection.
      const tEnd = Math.max(40 / Math.abs(sigma), (20 * 2 * Math.PI) / params.omega);
      const n = 20000;
      const series = simulatePeriodicResponse(params, tEnd, n);

      const period = (2 * Math.PI) / params.omega;
      const lastCyclesStart = tEnd - 4 * period;
      const tail = series.filter((p) => p.t >= lastCyclesStart);
      const numericAmplitude = Math.max(...tail.map((p) => Math.abs(p.x)));

      const expectedAmplitude = steadyStateAmplitude(params.omega, params);
      expect(numericAmplitude).toBeCloseTo(expectedAmplitude, 2);

      // Phase check: locate a numeric peak near the end and compare its time offset
      // from the nearest forcing peak (at t = pi/(2 omega) + n*period) to phi/omega.
      let peakIdx = 0;
      for (let i = 1; i < tail.length - 1; i++) {
        if (tail[i].x > tail[i - 1].x && tail[i].x > tail[i + 1].x) {
          peakIdx = i;
        }
      }
      const peakTime = tail[peakIdx].t;
      const expectedPhase = steadyStatePhase(params.omega, params);
      // x_ss peaks when omega*t - phi = pi/2 (mod 2 pi).
      const peakPhaseResidual =
        (params.omega * peakTime - expectedPhase - Math.PI / 2) % (2 * Math.PI);
      const wrapped = Math.min(
        Math.abs(peakPhaseResidual),
        Math.abs(peakPhaseResidual - 2 * Math.PI),
        Math.abs(peakPhaseResidual + 2 * Math.PI),
      );
      expect(wrapped).toBeLessThan(0.05);
    }
  });
});
