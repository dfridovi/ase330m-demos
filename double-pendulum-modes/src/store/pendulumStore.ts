import { create } from 'zustand';
import type { PhysicalParams } from '../core/types/pendulum.ts';
import type { StateSpace } from '../core/types/stateSpace.ts';
import type { ModalSimulationResult } from '../core/sim/modalDecomposition.ts';
import type { Vector } from '../core/sim/rk4.ts';
import { assembleStateSpace } from '../core/dynamics/stateSpace.ts';
import { decomposeModes, simulateModes } from '../core/sim/modalDecomposition.ts';
import { pureModeInitialCondition, sortModalResult } from '../core/dynamics/modeShape.ts';

export const DEFAULT_PARAMS: PhysicalParams = { m1: 1, m2: 1, l1: 1, l2: 1, g: 9.81 };

// A pure-mode initial condition swings both bobs by this amplitude at most, which comfortably
// stays in the small-angle regime the linearization assumes (~<25 deg) while still being an
// easy-to-see swing on a classroom projector.
const PURE_MODE_AMPLITUDE_RAD = 0.3;

const SAMPLE_COUNT = 2400;
// However slow the slower mode is, show at least this many of its cycles so a beat pattern
// between the two modes (in the "mixed" preset) has room to develop visibly.
const MIN_SLOW_MODE_CYCLES = 4;

function computeDerived(physicalParams: PhysicalParams, x0: Vector) {
  const stateSpace = assembleStateSpace(physicalParams);
  const { modes } = decomposeModes(stateSpace.A, x0);
  const slowestWn = Math.min(...modes.map((m) => m.naturalFrequency ?? Infinity));
  const slowPeriod = (2 * Math.PI) / slowestWn;
  const tSpan: [number, number] = [0, slowPeriod * MIN_SLOW_MODE_CYCLES];
  const dt = tSpan[1] / SAMPLE_COUNT;
  const modal = sortModalResult(simulateModes(stateSpace, x0, tSpan, dt));
  return { stateSpace, modal, tSpan, dt };
}

function computePureModeX0(stateSpace: StateSpace, modal: ModalSimulationResult, modeIndex: 0 | 1): Vector {
  return pureModeInitialCondition(stateSpace.A, modal.modes[modeIndex].indices[0], PURE_MODE_AMPLITUDE_RAD);
}

const initialStateSpace = assembleStateSpace(DEFAULT_PARAMS);
// Seed x0 at zero just to learn the mode structure, then build the real default ("mixed")
// initial condition as literally mode1 + mode2 — the clearest possible illustration that any
// free response is a sum of the two normal modes.
const seedModal = sortModalResult(simulateModes(initialStateSpace, [0, 0, 0, 0], [0, 1], 0.01));
const defaultX0 = (() => {
  const ic1 = computePureModeX0(initialStateSpace, seedModal, 0);
  const ic2 = computePureModeX0(initialStateSpace, seedModal, 1);
  return ic1.map((v, i) => v + ic2[i]);
})();
const initialDerived = computeDerived(DEFAULT_PARAMS, defaultX0);

export type PresetId = 'mode1' | 'mode2' | 'mixed' | 'custom';

interface PendulumState {
  physicalParams: PhysicalParams;
  x0: Vector;
  tSpan: [number, number];
  dt: number;
  stateSpace: StateSpace;
  /** Sorted ascending by natural frequency: modes[0] is the slow, in-phase mode; modes[1] is
   * the fast, anti-phase mode. */
  modal: ModalSimulationResult;
  activePreset: PresetId;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  resetToken: number;
  showFull: boolean;
  showMode1: boolean;
  showMode2: boolean;

  setPhysicalParam: <K extends keyof PhysicalParams>(key: K, value: PhysicalParams[K]) => void;
  setInitialCondition: (x0: Vector) => void;
  setPureModePreset: (modeIndex: 0 | 1) => void;
  setMixedPreset: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  setShowFull: (show: boolean) => void;
  setShowMode1: (show: boolean) => void;
  setShowMode2: (show: boolean) => void;
  tick: (deltaSeconds: number) => void;
}

export const usePendulumStore = create<PendulumState>((set, get) => ({
  physicalParams: DEFAULT_PARAMS,
  x0: defaultX0,
  tSpan: initialDerived.tSpan,
  dt: initialDerived.dt,
  stateSpace: initialDerived.stateSpace,
  modal: initialDerived.modal,
  activePreset: 'mixed',

  currentTime: 0,
  isPlaying: false,
  speed: 1,
  resetToken: 0,
  showFull: true,
  showMode1: true,
  showMode2: true,

  setPhysicalParam: (key, value) => {
    const physicalParams = { ...get().physicalParams, [key]: value };
    const derived = computeDerived(physicalParams, get().x0);
    set((s) => ({ physicalParams, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setInitialCondition: (x0) => {
    const derived = computeDerived(get().physicalParams, x0);
    set((s) => ({ x0, activePreset: 'custom', ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setPureModePreset: (modeIndex) => {
    const { stateSpace, modal } = get();
    const x0 = computePureModeX0(stateSpace, modal, modeIndex);
    const derived = computeDerived(get().physicalParams, x0);
    set((s) => ({
      x0,
      activePreset: modeIndex === 0 ? 'mode1' : 'mode2',
      ...derived,
      currentTime: 0,
      resetToken: s.resetToken + 1,
    }));
  },

  setMixedPreset: () => {
    const { stateSpace, modal, physicalParams } = get();
    const ic1 = computePureModeX0(stateSpace, modal, 0);
    const ic2 = computePureModeX0(stateSpace, modal, 1);
    const x0 = ic1.map((v, i) => v + ic2[i]);
    const derived = computeDerived(physicalParams, x0);
    set((s) => ({ x0, activePreset: 'mixed', ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setShowFull: (showFull) => set({ showFull }),
  setShowMode1: (showMode1) => set({ showMode1 }),
  setShowMode2: (showMode2) => set({ showMode2 }),

  tick: (deltaSeconds) => {
    const { currentTime, speed, isPlaying, tSpan, resetToken } = get();
    if (!isPlaying) return;
    let next = currentTime + deltaSeconds * speed;
    const looped = next > tSpan[1];
    if (looped) next = tSpan[0];
    set({ currentTime: next, resetToken: looped ? resetToken + 1 : resetToken });
  },
}));
