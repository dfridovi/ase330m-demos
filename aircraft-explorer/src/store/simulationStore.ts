import { create } from 'zustand';
import type { PhysicalParams } from '../core/types/aircraft.ts';
import type { StateSpace } from '../core/types/stateSpace.ts';
import type { ModalSimulationResult } from '../core/sim/modalDecomposition.ts';
import type { Trajectory, Vector } from '../core/sim/rk4.ts';
import type { LateralKinematics, LongitudinalKinematics } from '../core/sim/simulate.ts';
import { assembleLongitudinalStateSpace } from '../core/aero/stateSpace.ts';
import { assembleLateralStateSpace } from '../core/aero/lateralStateSpace.ts';
import { simulateModes } from '../core/sim/modalDecomposition.ts';
import { deriveLateralKinematics, deriveLongitudinalKinematics, doubletInput, simulate } from '../core/sim/simulate.ts';
import { AIRFRAME_PRESETS, GENERAL_AVIATION } from '../core/aero/presets.ts';

// Phugoid period varies a lot across presets (it scales with 1/wn), so the simulation window
// is per-preset (AirframePreset.tSpan) rather than one constant — otherwise a slow-phugoid
// aircraft like the Fighter would only show a partial swing in a GA-tuned 60s window. Step
// size is derived from that window to keep sample count (and therefore chart-render and
// RK4 cost) roughly constant across presets instead of ballooning for the longer ones.
const SAMPLE_COUNT = 3000;
function dtForTSpan(tSpan: [number, number]): number {
  return (tSpan[1] - tSpan[0]) / SAMPLE_COUNT;
}

const ELEVATOR_DOUBLET_START = 1;
const ELEVATOR_DOUBLET_HALF_DURATION = 1;

export type InputMode = 'freeResponse' | 'elevatorDoublet';
export type ModeVisibility = 'full' | 'shortPeriodOnly' | 'phugoidOnly';
export type Axis = 'longitudinal' | 'lateral';

function computeLongitudinalDerived(
  physicalParams: PhysicalParams,
  presetId: string,
  x0: Vector,
  elevatorMagnitudeRad: number,
  tSpan: [number, number],
  dt: number,
) {
  const preset = AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION;
  const stateSpace = assembleLongitudinalStateSpace(physicalParams, preset.coefficients);
  const modal = simulateModes(stateSpace, x0, tSpan, dt);
  const forcedResponse = simulate(stateSpace, {
    x0: [0, 0, 0, 0],
    input: doubletInput(elevatorMagnitudeRad, ELEVATOR_DOUBLET_START, ELEVATOR_DOUBLET_HALF_DURATION),
    tSpan,
    dt,
  });
  const freeKinematics = deriveLongitudinalKinematics(modal.fullResponse, physicalParams.trimSpeed);
  const forcedKinematics = deriveLongitudinalKinematics(forcedResponse, physicalParams.trimSpeed);
  return { stateSpace, modal, forcedResponse, freeKinematics, forcedKinematics };
}

// Lateral has no forced-response (aileron/rudder doublet) yet — deferred, see the project plan
// — so there's no lat-prefixed sibling to forcedResponse/forcedKinematics.
function computeLateralDerived(
  physicalParams: PhysicalParams,
  presetId: string,
  latX0: Vector,
  latTSpan: [number, number],
  latDt: number,
) {
  const preset = AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION;
  const latStateSpace = assembleLateralStateSpace(physicalParams, preset.lateral.coefficients);
  const latModal = simulateModes(latStateSpace, latX0, latTSpan, latDt);
  const latFreeKinematics = deriveLateralKinematics(latModal.fullResponse, physicalParams.trimSpeed);
  return { latStateSpace, latModal, latFreeKinematics };
}

interface SimulationState {
  presetId: string;
  physicalParams: PhysicalParams;
  activeAxis: Axis;
  x0: Vector;
  elevatorMagnitudeRad: number;
  inputMode: InputMode;
  tSpan: [number, number];
  dt: number;

  stateSpace: StateSpace;
  modal: ModalSimulationResult;
  forcedResponse: Trajectory;
  freeKinematics: LongitudinalKinematics;
  forcedKinematics: LongitudinalKinematics;

  latX0: Vector;
  latTSpan: [number, number];
  latDt: number;
  latStateSpace: StateSpace;
  latModal: ModalSimulationResult;
  latFreeKinematics: LateralKinematics;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  modeVisibility: ModeVisibility;
  /** Bumped whenever the trajectory changes discontinuously (preset/input/loop reset), so
   * the 3D scene can key off it to clear the trail buffer instead of smearing across the jump. */
  resetToken: number;

  setPreset: (id: string) => void;
  setPhysicalParam: <K extends keyof PhysicalParams>(key: K, value: PhysicalParams[K]) => void;
  setInitialCondition: (x0: Vector) => void;
  setLateralInitialCondition: (x0: Vector) => void;
  setElevatorMagnitudeRad: (magnitude: number) => void;
  setInputMode: (mode: InputMode) => void;
  setAxis: (axis: Axis) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  setModeVisibility: (v: ModeVisibility) => void;
  tick: (deltaSeconds: number) => void;
  activeResponse: () => Trajectory;
  activeKinematics: () => LongitudinalKinematics | LateralKinematics;
  activeStateSpace: () => StateSpace;
  activeModal: () => ModalSimulationResult;
  activeTSpan: () => [number, number];
}

const initialDt = dtForTSpan(GENERAL_AVIATION.tSpan);
const initialDerived = computeLongitudinalDerived(
  GENERAL_AVIATION.defaultParams,
  GENERAL_AVIATION.id,
  GENERAL_AVIATION.defaultX0,
  0,
  GENERAL_AVIATION.tSpan,
  initialDt,
);
const initialLatDt = dtForTSpan(GENERAL_AVIATION.lateral.tSpan);
const initialLatDerived = computeLateralDerived(
  GENERAL_AVIATION.defaultParams,
  GENERAL_AVIATION.id,
  GENERAL_AVIATION.lateral.defaultX0,
  GENERAL_AVIATION.lateral.tSpan,
  initialLatDt,
);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  presetId: GENERAL_AVIATION.id,
  physicalParams: GENERAL_AVIATION.defaultParams,
  activeAxis: 'longitudinal',
  x0: GENERAL_AVIATION.defaultX0,
  elevatorMagnitudeRad: 0.035, // ~2 deg
  inputMode: 'freeResponse',
  tSpan: GENERAL_AVIATION.tSpan,
  dt: initialDt,

  stateSpace: initialDerived.stateSpace,
  modal: initialDerived.modal,
  forcedResponse: initialDerived.forcedResponse,
  freeKinematics: initialDerived.freeKinematics,
  forcedKinematics: initialDerived.forcedKinematics,

  latX0: GENERAL_AVIATION.lateral.defaultX0,
  latTSpan: GENERAL_AVIATION.lateral.tSpan,
  latDt: initialLatDt,
  latStateSpace: initialLatDerived.latStateSpace,
  latModal: initialLatDerived.latModal,
  latFreeKinematics: initialLatDerived.latFreeKinematics,

  currentTime: 0,
  isPlaying: false,
  speed: 1,
  modeVisibility: 'full',
  resetToken: 0,

  setPreset: (id) => {
    const preset = AIRFRAME_PRESETS.find((p) => p.id === id) ?? GENERAL_AVIATION;
    const { elevatorMagnitudeRad } = get();
    const x0 = preset.defaultX0;
    const tSpan = preset.tSpan;
    const dt = dtForTSpan(tSpan);
    const derived = computeLongitudinalDerived(preset.defaultParams, id, x0, elevatorMagnitudeRad, tSpan, dt);
    const latX0 = preset.lateral.defaultX0;
    const latTSpan = preset.lateral.tSpan;
    const latDt = dtForTSpan(latTSpan);
    const latDerived = computeLateralDerived(preset.defaultParams, id, latX0, latTSpan, latDt);
    set((s) => ({
      presetId: id,
      physicalParams: preset.defaultParams,
      x0,
      tSpan,
      dt,
      latX0,
      latTSpan,
      latDt,
      currentTime: 0,
      resetToken: s.resetToken + 1,
      ...derived,
      ...latDerived,
    }));
  },

  setPhysicalParam: (key, value) => {
    const physicalParams = { ...get().physicalParams, [key]: value };
    const { presetId, x0, elevatorMagnitudeRad, tSpan, dt, latX0, latTSpan, latDt } = get();
    const derived = computeLongitudinalDerived(physicalParams, presetId, x0, elevatorMagnitudeRad, tSpan, dt);
    const latDerived = computeLateralDerived(physicalParams, presetId, latX0, latTSpan, latDt);
    set({ physicalParams, ...derived, ...latDerived });
  },

  setInitialCondition: (x0) => {
    const { physicalParams, presetId, elevatorMagnitudeRad, tSpan, dt } = get();
    const derived = computeLongitudinalDerived(physicalParams, presetId, x0, elevatorMagnitudeRad, tSpan, dt);
    set({ x0, currentTime: 0, ...derived });
  },

  setLateralInitialCondition: (latX0) => {
    const { physicalParams, presetId, latTSpan, latDt } = get();
    const latDerived = computeLateralDerived(physicalParams, presetId, latX0, latTSpan, latDt);
    set({ latX0, currentTime: 0, ...latDerived });
  },

  setElevatorMagnitudeRad: (elevatorMagnitudeRad) => {
    const { physicalParams, presetId, x0, tSpan, dt } = get();
    const derived = computeLongitudinalDerived(physicalParams, presetId, x0, elevatorMagnitudeRad, tSpan, dt);
    set({ elevatorMagnitudeRad, ...derived });
  },

  setInputMode: (inputMode) => set((s) => ({ inputMode, currentTime: 0, resetToken: s.resetToken + 1 })),

  setAxis: (axis) => set((s) => ({ activeAxis: axis, currentTime: 0, resetToken: s.resetToken + 1 })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setModeVisibility: (modeVisibility) => set({ modeVisibility }),

  tick: (deltaSeconds) => {
    const { currentTime, speed, isPlaying, resetToken } = get();
    if (!isPlaying) return;
    const tSpan = get().activeTSpan();
    let next = currentTime + deltaSeconds * speed;
    const looped = next > tSpan[1];
    if (looped) next = tSpan[0];
    set({ currentTime: next, resetToken: looped ? resetToken + 1 : resetToken });
  },

  activeResponse: () => {
    const { activeAxis, inputMode, modal, forcedResponse, latModal } = get();
    if (activeAxis === 'lateral') return latModal.fullResponse;
    return inputMode === 'freeResponse' ? modal.fullResponse : forcedResponse;
  },

  activeKinematics: () => {
    const { activeAxis, inputMode, freeKinematics, forcedKinematics, latFreeKinematics } = get();
    if (activeAxis === 'lateral') return latFreeKinematics;
    return inputMode === 'freeResponse' ? freeKinematics : forcedKinematics;
  },

  activeStateSpace: () => {
    const { activeAxis, stateSpace, latStateSpace } = get();
    return activeAxis === 'lateral' ? latStateSpace : stateSpace;
  },

  activeModal: () => {
    const { activeAxis, modal, latModal } = get();
    return activeAxis === 'lateral' ? latModal : modal;
  },

  activeTSpan: () => {
    const { activeAxis, tSpan, latTSpan } = get();
    return activeAxis === 'lateral' ? latTSpan : tSpan;
  },
}));
