import { create } from 'zustand';
import { DEFAULT_PARAMS, FREQ_SWEEP } from '../core/constants.ts';
import { getModalParams, getStateSpace } from '../core/dynamics/quarterCar.ts';
import { stepResponseSeries } from '../core/dynamics/stepResponse.ts';
import { impulseResponseSeries } from '../core/dynamics/impulseResponse.ts';
import {
  frequencyResponseSeries,
  steadyStateAmplitude,
  steadyStatePhase,
} from '../core/dynamics/frequencyResponse.ts';
import { simulatePeriodicResponse } from '../core/sim/simulate.ts';
import { PRESETS } from '../core/dynamics/presets.ts';
import type {
  CarParams,
  FrequencyPoint,
  SeriesPoint,
  StateSpace,
} from '../core/types/params.ts';

export type ResponseTab = 'periodic' | 'step' | 'impulse' | 'frequency';

const PERIODIC_SAMPLES = 1200;
const STEP_IMPULSE_SAMPLES = 900;
// Multiples of 1/|sigma| considered "settled" (e^-8 ~ 0.03%).
const DECAY_TIME_CONSTANT = 8;
const PERIODIC_CYCLES_SHOWN = 8;

type FullParams = CarParams & { omega: number; f0: number; I: number };

function computeDerived(params: FullParams) {
  const modal = getModalParams(params);
  const stateSpace = getStateSpace(params);

  const tEndSettle = DECAY_TIME_CONSTANT / Math.abs(modal.sigma);
  const tEndPeriodic = Math.max(
    tEndSettle,
    (PERIODIC_CYCLES_SHOWN * 2 * Math.PI) / params.omega,
  );

  const periodicSeries = simulatePeriodicResponse(params, tEndPeriodic, PERIODIC_SAMPLES);
  const stepSeries = stepResponseSeries(params, tEndSettle, STEP_IMPULSE_SAMPLES);
  const impulseSeries = impulseResponseSeries(params, tEndSettle, STEP_IMPULSE_SAMPLES);
  const frequencyResponse = frequencyResponseSeries(
    params,
    FREQ_SWEEP.omegaMin,
    FREQ_SWEEP.omegaMax,
    FREQ_SWEEP.points,
  );
  const steadyStateAtOmega = {
    magnitude: steadyStateAmplitude(params.omega, params),
    phase: steadyStatePhase(params.omega, params),
  };

  return {
    sigma: modal.sigma,
    omegaD: modal.omegaD,
    isOverdamped: modal.isOverdamped,
    stateSpace,
    tEndPeriodic,
    tEndSettle,
    periodicSeries,
    stepSeries,
    impulseSeries,
    frequencyResponse,
    steadyStateAtOmega,
  };
}

function matchingPresetId(m: number, k: number, c: number): string {
  return PRESETS.find((p) => p.m === m && p.k === k && p.c === c)?.id ?? 'custom';
}

const initialDerived = computeDerived(DEFAULT_PARAMS);

interface CarShocksState {
  m: number;
  k: number;
  c: number;
  omega: number;
  f0: number;
  I: number;

  sigma: number;
  omegaD: number;
  isOverdamped: boolean;
  stateSpace: StateSpace;
  tEndPeriodic: number;
  tEndSettle: number;
  periodicSeries: SeriesPoint[];
  stepSeries: SeriesPoint[];
  impulseSeries: SeriesPoint[];
  frequencyResponse: FrequencyPoint[];
  steadyStateAtOmega: { magnitude: number; phase: number };

  activePresetId: string;
  activeTab: ResponseTab;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  resetToken: number;

  setM: (m: number) => void;
  setK: (k: number) => void;
  setC: (c: number) => void;
  setOmega: (omega: number) => void;
  setF0: (f0: number) => void;
  setI: (I: number) => void;
  applyPreset: (id: string) => void;
  setActiveTab: (tab: ResponseTab) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  tick: (deltaSeconds: number) => void;
}

export const useCarShocksStore = create<CarShocksState>((set, get) => ({
  ...DEFAULT_PARAMS,
  ...initialDerived,
  activePresetId: matchingPresetId(DEFAULT_PARAMS.m, DEFAULT_PARAMS.k, DEFAULT_PARAMS.c),
  activeTab: 'periodic',

  currentTime: 0,
  isPlaying: false,
  speed: 1,
  resetToken: 0,

  setM: (m) => {
    const { k, c, omega, f0, I } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({
      m,
      activePresetId: matchingPresetId(m, k, c),
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setK: (k) => {
    const { m, c, omega, f0, I } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({
      k,
      activePresetId: matchingPresetId(m, k, c),
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setC: (c) => {
    const { m, k, omega, f0, I } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({
      c,
      activePresetId: matchingPresetId(m, k, c),
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setOmega: (omega) => {
    const { m, k, c, f0, I } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({ omega, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setF0: (f0) => {
    const { m, k, c, omega, I } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({ f0, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setI: (I) => {
    const { m, k, c, omega, f0 } = get();
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({ I, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  applyPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { omega: prevOmega, f0, I } = get();
    const { m, k, c } = preset;
    const omega = preset.omega ?? prevOmega;
    const derived = computeDerived({ m, k, c, omega, f0, I });
    set((s) => ({
      m,
      k,
      c,
      omega,
      activePresetId: id,
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setActiveTab: (tab) =>
    set((s) => ({
      activeTab: tab,
      currentTime: 0,
      isPlaying: false,
      resetToken: s.resetToken + 1,
    })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (t) => set({ currentTime: t }),

  tick: (deltaSeconds) => {
    const { isPlaying, activeTab, currentTime, speed, tEndPeriodic, tEndSettle, resetToken } = get();
    if (!isPlaying) return;
    const next = currentTime + deltaSeconds * speed;

    if (activeTab === 'periodic') {
      const looped = next > tEndPeriodic;
      set({ currentTime: looped ? 0 : next, resetToken: looped ? resetToken + 1 : resetToken });
      return;
    }

    if (activeTab === 'step' || activeTab === 'impulse') {
      if (next >= tEndSettle) {
        set({ currentTime: tEndSettle, isPlaying: false });
      } else {
        set({ currentTime: next });
      }
      return;
    }

    // 'frequency' tab has no time-domain playback; nothing to advance.
  },
}));
