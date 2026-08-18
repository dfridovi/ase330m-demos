import { create } from 'zustand';
import type { StateSpace } from '../core/types/stateSpace.ts';
import type { Trajectory, Vector } from '../core/sim/rk4.ts';
import type { LongitudinalKinematics } from '../core/sim/simulate.ts';
import type { Complex } from '../core/linalg/eig.ts';
import type { FrequencyPoint } from '../core/control/frequencyResponse.ts';
import type { ManeuverId, SinusoidChannel } from '../core/control/referenceSignals.ts';
import { assembleLongitudinalStateSpace } from '../core/aero/stateSpace.ts';
import { GENERAL_AVIATION } from '../core/aero/presets.ts';
import { eigenDecompose } from '../core/linalg/eig.ts';
import { sisoZeros } from '../core/linalg/zeros.ts';
import { deriveLongitudinalKinematics } from '../core/sim/simulate.ts';
import { closedLoopA, simulateStateFeedback } from '../core/control/closedLoopSim.ts';
import { closedLoopFrequencyResponse, logFrequencySweep } from '../core/control/frequencyResponse.ts';
import {
  pitchStepReference,
  sinusoidReference,
  speedStepReference,
  trimHoldReference,
} from '../core/control/referenceSignals.ts';

const STATE_SPACE: StateSpace = assembleLongitudinalStateSpace(
  GENERAL_AVIATION.defaultParams,
  GENERAL_AVIATION.coefficients,
);
const OPEN_LOOP_POLES = eigenDecompose(STATE_SPACE.A).eigenvalues;

// Same fixed-sample-count-over-window approach as aircraft-explorer's simulationStore, so
// chart/RK4 cost stays roughly constant across the very different playback windows the four
// maneuvers need (a slow trim-hold phugoid vs. a handful of sinusoid cycles).
const SAMPLE_COUNT = 3000;
const STEP_START_TIME = 2;
const DEG_TO_RAD = Math.PI / 180;

const FREQUENCY_SWEEP = logFrequencySweep(0.01, 5, 200);

/** 0=du, 3=theta — which state each maneuver's reference channel drives, and therefore which
 * output is watched for tracking/zeros/frequency-response purposes by default. */
function activeChannelIndex(maneuver: ManeuverId, sinusoidChannel: SinusoidChannel): number {
  if (maneuver === 'speedStep') return 0;
  if (maneuver === 'sinusoid') return sinusoidChannel === 'du' ? 0 : 3;
  return 3; // trimHold, pitchStep
}

function tSpanForManeuver(maneuver: ManeuverId, sinusoidOmega: number): [number, number] {
  if (maneuver === 'trimHold') return [0, 120];
  if (maneuver === 'sinusoid') {
    const period = (2 * Math.PI) / sinusoidOmega;
    return [0, Math.min(200, Math.max(30, period * 8))];
  }
  return [0, 60]; // speedStep, pitchStep
}

function buildReference(
  maneuver: ManeuverId,
  speedStepMagnitude: number,
  pitchStepMagnitude: number,
  sinusoidChannel: SinusoidChannel,
  sinusoidAmplitude: number,
  sinusoidOmega: number,
) {
  switch (maneuver) {
    case 'speedStep':
      return speedStepReference(speedStepMagnitude, STEP_START_TIME);
    case 'pitchStep':
      return pitchStepReference(pitchStepMagnitude, STEP_START_TIME);
    case 'sinusoid':
      return sinusoidReference(sinusoidChannel, sinusoidAmplitude, sinusoidOmega);
    default:
      return trimHoldReference();
  }
}

function sampleReference(xRef: (t: number) => Vector, times: number[]): Trajectory {
  return { t: times, x: times.map((t) => xRef(t)) };
}

interface DerivedFields {
  x0: Vector;
  tSpan: [number, number];
  trajectory: Trajectory;
  xRefTrajectory: Trajectory;
  kinematics: LongitudinalKinematics;
  diverged: boolean;
  closedLoopPoles: Complex[];
  zeros: Complex[];
  frequencyResponse: FrequencyPoint[];
  activeChannel: number;
}

function computeDerived(
  K: Vector,
  maneuver: ManeuverId,
  speedStepMagnitude: number,
  pitchStepMagnitude: number,
  sinusoidChannel: SinusoidChannel,
  sinusoidAmplitude: number,
  sinusoidOmega: number,
): DerivedFields {
  const activeChannel = activeChannelIndex(maneuver, sinusoidChannel);
  const x0: Vector = maneuver === 'trimHold' ? GENERAL_AVIATION.disturbanceX0 : [0, 0, 0, 0];
  const tSpan = tSpanForManeuver(maneuver, sinusoidOmega);
  const dt = (tSpan[1] - tSpan[0]) / SAMPLE_COUNT;
  const xRef = buildReference(maneuver, speedStepMagnitude, pitchStepMagnitude, sinusoidChannel, sinusoidAmplitude, sinusoidOmega);

  const { trajectory, diverged } = simulateStateFeedback(STATE_SPACE, K, x0, xRef, tSpan, dt);
  const xRefTrajectory = sampleReference(xRef, trajectory.t);
  const kinematics = deriveLongitudinalKinematics(trajectory, GENERAL_AVIATION.defaultParams.trimSpeed);

  const closedLoopPoles = eigenDecompose(closedLoopA(STATE_SPACE, K)).eigenvalues;
  const outputRow = Array.from({ length: 4 }, (_, i) => (i === activeChannel ? 1 : 0));
  const zeros = sisoZeros(STATE_SPACE.A, STATE_SPACE.B, [outputRow]);
  const frequencyResponse = closedLoopFrequencyResponse(STATE_SPACE, K, activeChannel, activeChannel, FREQUENCY_SWEEP);

  return { x0, tSpan, trajectory, xRefTrajectory, kinematics, diverged, closedLoopPoles, zeros, frequencyResponse, activeChannel };
}

interface ControlState {
  stateSpace: StateSpace;
  openLoopPoles: Complex[];

  K: Vector;
  maneuver: ManeuverId;
  speedStepMagnitude: number;
  pitchStepMagnitude: number;
  sinusoidChannel: SinusoidChannel;
  sinusoidAmplitude: number;
  sinusoidOmega: number;

  x0: Vector;
  tSpan: [number, number];
  trajectory: Trajectory;
  xRefTrajectory: Trajectory;
  kinematics: LongitudinalKinematics;
  diverged: boolean;
  closedLoopPoles: Complex[];
  zeros: Complex[];
  frequencyResponse: FrequencyPoint[];
  activeChannel: number;

  currentTime: number;
  isPlaying: boolean;
  speed: number;
  resetToken: number;

  setGain: (index: number, value: number) => void;
  setManeuver: (maneuver: ManeuverId) => void;
  setSpeedStepMagnitude: (value: number) => void;
  setPitchStepMagnitude: (value: number) => void;
  setSinusoidChannel: (channel: SinusoidChannel) => void;
  setSinusoidAmplitude: (value: number) => void;
  setSinusoidOmega: (value: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (t: number) => void;
  tick: (deltaSeconds: number) => void;
}

// A mildly stabilizing starting point rather than K=0: phugoid poles move from
// (re=-0.019, im=0.213, zeta~0.08) to a pair around (re=-0.161, im=0.092, zeta~0.87), and the
// short-period pair collapses into two fast real roots. Gives students a "nominal" K to make
// small adjustments around (see GainControls.tsx's ranges) and decent out-of-the-box tracking
// on the sinusoidal maneuver below, instead of starting from the undamped open-loop response —
// which is still one slider-drag away (set every gain to 0) for the direct aircraft-explorer
// comparison the trim-hold hint text describes.
const initialK: Vector = [0, 0, -0.3, -0.15];
const initialManeuver: ManeuverId = 'trimHold';
const initialSpeedStepMagnitude = 5; // m/s
const initialPitchStepMagnitude = 5 * DEG_TO_RAD;
const initialSinusoidChannel: SinusoidChannel = 'theta';
const initialSinusoidAmplitude = 3 * DEG_TO_RAD;
// Near the closed-loop phugoid pair's natural frequency (~0.186 rad/s) but past its damping
// peak: |G(i*0.15)| ~ 0.89 and phase ~ -5 deg with the initialK above, i.e. theta tracks
// theta_ref closely (see the frequencyResponse test for the general cross-check method).
const initialSinusoidOmega = 0.15; // rad/s

const initialDerived = computeDerived(
  initialK,
  initialManeuver,
  initialSpeedStepMagnitude,
  initialPitchStepMagnitude,
  initialSinusoidChannel,
  initialSinusoidAmplitude,
  initialSinusoidOmega,
);

export const useControlStore = create<ControlState>((set, get) => ({
  stateSpace: STATE_SPACE,
  openLoopPoles: OPEN_LOOP_POLES,

  K: initialK,
  maneuver: initialManeuver,
  speedStepMagnitude: initialSpeedStepMagnitude,
  pitchStepMagnitude: initialPitchStepMagnitude,
  sinusoidChannel: initialSinusoidChannel,
  sinusoidAmplitude: initialSinusoidAmplitude,
  sinusoidOmega: initialSinusoidOmega,

  ...initialDerived,

  currentTime: 0,
  isPlaying: false,
  speed: 1,
  resetToken: 0,

  setGain: (index, value) => {
    const K = [...get().K] as Vector;
    K[index] = value;
    const { maneuver, speedStepMagnitude, pitchStepMagnitude, sinusoidChannel, sinusoidAmplitude, sinusoidOmega } =
      get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set({ K, ...derived, currentTime: 0 });
  },

  setManeuver: (maneuver) => {
    const { K, speedStepMagnitude, pitchStepMagnitude, sinusoidChannel, sinusoidAmplitude, sinusoidOmega } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set((s) => ({ maneuver, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setSpeedStepMagnitude: (speedStepMagnitude) => {
    const { K, maneuver, pitchStepMagnitude, sinusoidChannel, sinusoidAmplitude, sinusoidOmega } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set({ speedStepMagnitude, ...derived, currentTime: 0 });
  },

  setPitchStepMagnitude: (pitchStepMagnitude) => {
    const { K, maneuver, speedStepMagnitude, sinusoidChannel, sinusoidAmplitude, sinusoidOmega } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set({ pitchStepMagnitude, ...derived, currentTime: 0 });
  },

  setSinusoidChannel: (sinusoidChannel) => {
    const { K, maneuver, speedStepMagnitude, pitchStepMagnitude, sinusoidAmplitude, sinusoidOmega } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set((s) => ({ sinusoidChannel, ...derived, currentTime: 0, resetToken: s.resetToken + 1 }));
  },

  setSinusoidAmplitude: (sinusoidAmplitude) => {
    const { K, maneuver, speedStepMagnitude, pitchStepMagnitude, sinusoidChannel, sinusoidOmega } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set({ sinusoidAmplitude, ...derived, currentTime: 0 });
  },

  setSinusoidOmega: (sinusoidOmega) => {
    const { K, maneuver, speedStepMagnitude, pitchStepMagnitude, sinusoidChannel, sinusoidAmplitude } = get();
    const derived = computeDerived(
      K,
      maneuver,
      speedStepMagnitude,
      pitchStepMagnitude,
      sinusoidChannel,
      sinusoidAmplitude,
      sinusoidOmega,
    );
    set({ sinusoidOmega, ...derived, currentTime: 0 });
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
