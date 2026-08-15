import { create } from 'zustand';
import type { RelativeState } from '../core/types/orbit';
import type { TimeSeries } from '../core/sim/simulate';
import { meanMotion, orbitalPeriod } from '../core/dynamics/cw';
import { generateTimeSeries } from '../core/sim/simulate';
import { PRESETS } from '../core/dynamics/presets';

export type ViewMode = '2d' | '3d';

// Long enough to see a drifting orbit visibly pull away from a closed one, short enough that
// the drift preset's along-track excursion doesn't dwarf the ~km-scale ellipse on screen.
const ORBIT_PERIODS_SHOWN = 2;
const SAMPLE_COUNT = 900;

function computeDerived(altitudeKm: number, x0: RelativeState) {
  const n = meanMotion(altitudeKm);
  const period = orbitalPeriod(n);
  const tSpan: [number, number] = [0, period * ORBIT_PERIODS_SHOWN];
  const timeSeries: TimeSeries = generateTimeSeries(x0, n, tSpan[1], SAMPLE_COUNT);
  return { n, period, tSpan, timeSeries };
}

const DEFAULT_ALTITUDE_KM = 400; // ISS-like, n ~ 0.00113 rad/s, matching the course MATLAB scripts
const initialN = meanMotion(DEFAULT_ALTITUDE_KM);
const defaultX0 = PRESETS[0].build(initialN);
const initialDerived = computeDerived(DEFAULT_ALTITUDE_KM, defaultX0);

interface CwState {
  altitudeKm: number;
  x0: RelativeState;
  activePresetId: string; // one of PRESETS[].id, or 'custom'

  n: number;
  period: number;
  tSpan: [number, number];
  timeSeries: TimeSeries;

  viewMode: ViewMode;
  showFull: boolean;
  showDrift: boolean;
  showInPlane: boolean;
  showCrossTrack: boolean;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  resetToken: number;

  setAltitude: (km: number) => void;
  setInitialConditionComponent: <K extends keyof RelativeState>(key: K, value: number) => void;
  setPreset: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowFull: (show: boolean) => void;
  setShowDrift: (show: boolean) => void;
  setShowInPlane: (show: boolean) => void;
  setShowCrossTrack: (show: boolean) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  tick: (deltaSeconds: number) => void;
}

export const useCwStore = create<CwState>((set, get) => ({
  altitudeKm: DEFAULT_ALTITUDE_KM,
  x0: defaultX0,
  activePresetId: PRESETS[0].id,

  n: initialDerived.n,
  period: initialDerived.period,
  tSpan: initialDerived.tSpan,
  timeSeries: initialDerived.timeSeries,

  viewMode: '3d',
  showFull: true,
  showDrift: true,
  showInPlane: true,
  showCrossTrack: true,

  currentTime: 0,
  isPlaying: false,
  // Orbital periods run ~1.5 hours of simulated time, so playback speed is simulated-seconds
  // per real second, not a small multiplier like the other two demos' second-scale dynamics.
  speed: 200,
  resetToken: 0,

  setAltitude: (altitudeKm) => {
    const { activePresetId, x0 } = get();
    const n = meanMotion(altitudeKm);
    // Presets encode the no-drift condition (vy0 = -2n x0) relative to n, so rebuild them when
    // altitude changes n; a manually-tuned ("custom") x0 is left alone.
    const nextX0 = activePresetId === 'custom' ? x0 : (PRESETS.find((p) => p.id === activePresetId)?.build(n) ?? x0);
    const derived = computeDerived(altitudeKm, nextX0);
    set((s) => ({ altitudeKm, x0: nextX0, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setInitialConditionComponent: (key, value) => {
    const { altitudeKm, x0 } = get();
    const nextX0 = { ...x0, [key]: value };
    const derived = computeDerived(altitudeKm, nextX0);
    set((s) => ({ x0: nextX0, activePresetId: 'custom', ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { altitudeKm, n } = get();
    const x0 = preset.build(n);
    const derived = computeDerived(altitudeKm, x0);
    set((s) => ({ x0, activePresetId: id, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setShowFull: (showFull) => set({ showFull }),
  setShowDrift: (showDrift) => set({ showDrift }),
  setShowInPlane: (showInPlane) => set({ showInPlane }),
  setShowCrossTrack: (showCrossTrack) => set({ showCrossTrack }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (t) => set({ currentTime: t }),

  tick: (deltaSeconds) => {
    const { currentTime, speed, isPlaying, tSpan, resetToken } = get();
    if (!isPlaying) return;
    let next = currentTime + deltaSeconds * speed;
    const looped = next > tSpan[1];
    if (looped) next = tSpan[0];
    set({ currentTime: next, resetToken: looped ? resetToken + 1 : resetToken });
  },
}));
