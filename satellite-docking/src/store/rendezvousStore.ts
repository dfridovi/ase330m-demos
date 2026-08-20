import { create } from 'zustand';
import type { RelativeState } from '../core/types/relativeState';
import type { Trajectory, Vector } from '../core/sim/rk4';
import type { Complex } from '../core/linalg/eig';
import { toVector } from '../core/types/relativeState';
import { inputMatrix, meanMotion, stateSpaceMatrix } from '../core/dynamics/cw';
import { INITIAL_CONDITION_PRESETS } from '../core/dynamics/presets';
import { GAIN_PRESETS } from '../core/control/gainPresets';
import { closedLoopA, cumulativeEffort, simulateStateFeedback } from '../core/control/closedLoopSim';
import { distanceSeries, timeToCapture } from '../core/control/metrics';
import { eigenDecompose } from '../core/linalg/eig';
import { sampleSeries } from '../core/sim/interpolate';

export interface SimResult {
  trajectory: Trajectory;
  u: Vector[];
  diverged: boolean;
  distance: number[];
  effort: number[];
}

// The view toggle doubles as the stage toggle: '2d' is the in-plane stage (2 thrusters, 4
// states, shown in the LVLH plane) and '3d' is the full stage (adds the cross-track thruster
// and states, shown in the 3D scene) -- one control instead of two separately-labeled "3D"
// buttons that only one of which actually changed what you could design.
export type ViewMode = '2d' | '3d';

const DEFAULT_ALTITUDE_KM = 400; // ISS-like, matching cw-dynamics
const SIM_DURATION_S = 4000; // less than one orbital period at 400km (~5540s) -- see gainPresets.ts
const SAMPLE_COUNT = 2000;
export const CAPTURE_THRESHOLD_M = 5;

const ZERO_REFERENCE: Vector = [0, 0, 0, 0, 0, 0];
const zeroReference = () => ZERO_REFERENCE;

function zeroK(): number[][] {
  return [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ];
}

function runSim(A: number[][], B: number[][], K: number[][], x0: Vector, tSpan: [number, number]): SimResult {
  const dt = (tSpan[1] - tSpan[0]) / SAMPLE_COUNT;
  const { trajectory, u, diverged } = simulateStateFeedback(A, B, K, x0, zeroReference, tSpan, dt);
  return { trajectory, u, diverged, distance: distanceSeries(trajectory), effort: cumulativeEffort(trajectory.t, u) };
}

interface DerivedFields {
  n: number;
  stateSpace: { A: number[][]; B: number[][] };
  tSpan: [number, number];
  current: SimResult;
  naive: SimResult;
  tuned: SimResult;
  openLoop: SimResult;
  timeToCaptureS: number | null;
  openLoopPoles: Complex[];
  closedLoopPoles: Complex[];
}

function computeDerived(altitudeKm: number, x0: RelativeState, K: number[][]): DerivedFields {
  const n = meanMotion(altitudeKm);
  const A = stateSpaceMatrix(n);
  const B = inputMatrix();
  const tSpan: [number, number] = [0, SIM_DURATION_S];
  const x0Vec = toVector(x0);

  const current = runSim(A, B, K, x0Vec, tSpan);
  const naive = runSim(A, B, GAIN_PRESETS.find((p) => p.id === 'naive')!.build(n), x0Vec, tSpan);
  const tuned = runSim(A, B, GAIN_PRESETS.find((p) => p.id === 'tuned')!.build(n), x0Vec, tSpan);
  // u=0 throughout -- the "what happens if you don't design a controller at all" baseline
  // every other trace (and the burn-vector visual) implicitly argues against.
  const openLoop = runSim(A, B, zeroK(), x0Vec, tSpan);

  const timeToCaptureS = timeToCapture(current.trajectory.t, current.distance, CAPTURE_THRESHOLD_M);
  const openLoopPoles = eigenDecompose(A).eigenvalues;
  const closedLoopPoles = eigenDecompose(closedLoopA(A, B, K)).eigenvalues;

  return { n, stateSpace: { A, B }, tSpan, current, naive, tuned, openLoop, timeToCaptureS, openLoopPoles, closedLoopPoles };
}

/** Linearly interpolates `values` (sampled at `sourceT`) onto `referenceT` -- used to compare
 * series that don't share an identical time grid (see core/sim/interpolate.ts's sampleSeries
 * doc comment for why: a very aggressive custom K can trip the adaptive RK4 step size and land
 * on a finer or shorter grid than the fixed reference gains). */
export function alignSeriesToGrid(referenceT: number[], sourceT: number[], values: number[]): number[] {
  return referenceT.map((t) => sampleSeries(sourceT, values, t));
}

export interface ComparisonSeries {
  t: number[];
  current: number[];
  naive: number[];
  tuned: number[];
  openLoop: number[];
}

/** Aligns all four traces (current/naive/tuned/openLoop) onto naive's time grid for a given
 * scalar field (distance, effort, or a single state component) -- the shared building block
 * behind every "your gain vs. naive vs. tuned vs. open loop" chart. */
export function alignComparisonSeries(
  current: SimResult,
  naive: SimResult,
  tuned: SimResult,
  openLoop: SimResult,
  extract: (s: SimResult) => number[],
): ComparisonSeries {
  const referenceT = naive.trajectory.t;
  return {
    t: referenceT,
    current: alignSeriesToGrid(referenceT, current.trajectory.t, extract(current)),
    naive: extract(naive),
    tuned: alignSeriesToGrid(referenceT, tuned.trajectory.t, extract(tuned)),
    openLoop: alignSeriesToGrid(referenceT, openLoop.trajectory.t, extract(openLoop)),
  };
}

const DEFAULT_ALTITUDE = DEFAULT_ALTITUDE_KM;
const initialN = meanMotion(DEFAULT_ALTITUDE);
const defaultX0 = INITIAL_CONDITION_PRESETS[0].build();
const defaultK = GAIN_PRESETS.find((p) => p.id === 'naive')!.build(initialN);
const initialDerived = computeDerived(DEFAULT_ALTITUDE, defaultX0, defaultK);

interface RendezvousState extends DerivedFields {
  altitudeKm: number;
  x0: RelativeState;
  activeInitialConditionPresetId: string; // one of INITIAL_CONDITION_PRESETS[].id, or 'custom'
  K: number[][];
  activeGainPresetId: string; // one of GAIN_PRESETS[].id, or 'custom'
  viewMode: ViewMode;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  resetToken: number;

  setAltitude: (km: number) => void;
  setInitialConditionComponent: <K extends keyof RelativeState>(key: K, value: number) => void;
  setInitialConditionPreset: (id: string) => void;
  setGain: (row: number, col: number, value: number) => void;
  setGainPreset: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  tick: (deltaSeconds: number) => void;
}

export const useRendezvousStore = create<RendezvousState>((set, get) => ({
  altitudeKm: DEFAULT_ALTITUDE,
  x0: defaultX0,
  activeInitialConditionPresetId: INITIAL_CONDITION_PRESETS[0].id,
  K: defaultK,
  activeGainPresetId: 'naive',
  // The in-plane story is inherently 2D anyway (see the demo README's Scope section), so
  // start there.
  viewMode: '2d',

  ...initialDerived,

  currentTime: 0,
  isPlaying: false,
  // The default 4000s window is a small fraction of an orbit -- 20 simulated seconds per real
  // second covers it in ~3.3 real minutes, comparable pacing to flight-control's maneuvers.
  speed: 20,
  resetToken: 0,

  setAltitude: (altitudeKm) => {
    const { x0, K } = get();
    const derived = computeDerived(altitudeKm, x0, K);
    set((s) => ({ altitudeKm, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setInitialConditionComponent: (key, value) => {
    const { altitudeKm, x0, K } = get();
    const nextX0 = { ...x0, [key]: value };
    const derived = computeDerived(altitudeKm, nextX0, K);
    set((s) => ({
      x0: nextX0,
      activeInitialConditionPresetId: 'custom',
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setInitialConditionPreset: (id) => {
    const preset = INITIAL_CONDITION_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { altitudeKm, K, viewMode } = get();
    const built = preset.build();
    const x0 = viewMode === '2d' ? { ...built, z: 0, vz: 0 } : built;
    const derived = computeDerived(altitudeKm, x0, K);
    set((s) => ({
      x0,
      activeInitialConditionPresetId: id,
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setGain: (row, col, value) => {
    const { altitudeKm, x0, K } = get();
    const nextK = K.map((r) => [...r]);
    nextK[row][col] = value;
    const derived = computeDerived(altitudeKm, x0, nextK);
    set({ K: nextK, activeGainPresetId: 'custom', ...derived, currentTime: 0 });
  },

  setGainPreset: (id) => {
    const preset = GAIN_PRESETS.find((p) => p.id === id);
    const { altitudeKm, x0, n } = get();
    const K = preset ? preset.build(n) : zeroK();
    const derived = computeDerived(altitudeKm, x0, K);
    set({ K, activeGainPresetId: preset ? id : 'zero', ...derived, currentTime: 0 });
  },

  setViewMode: (viewMode) => {
    const { altitudeKm, K, x0 } = get();
    // The 2D (in-plane) stage always has zero cross-track initial condition -- see
    // gainPresets.ts's design note on why leaving K's cross-track row/columns alone is
    // harmless either way.
    const nextX0 = viewMode === '2d' ? { ...x0, z: 0, vz: 0 } : x0;
    const derived = computeDerived(altitudeKm, nextX0, K);
    set((s) => ({ viewMode, x0: nextX0, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

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
