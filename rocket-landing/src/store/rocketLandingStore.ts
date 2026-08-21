import { create } from 'zustand';
import {
  DEFAULT_FUEL,
  DEFAULT_WEIGHTS,
  DRAG_BOUNDS,
  DT,
  G,
  HORIZON_STEPS,
  MASS,
  type CostWeights,
} from '../core/constants.ts';
import { SCENARIO_PRESETS } from '../core/dynamics/presets.ts';
import { coldStartTrajectory, solve } from '../core/mpc/ilqr.ts';
import { initialRtiState, step, type RtiState } from '../core/control/rtiSim.ts';
import type { Vector } from '../core/sim/rk4.ts';

// A couple of iLQR iterations per real-time tick (cheap, warm-started -- "real-time iteration"
// NMPC), vs. a fuller settle solve when the student is setting up an initial condition while
// paused, so the predicted-horizon preview looks converged. See the plan's real-time
// interaction strategy.
const LIVE_ITERATIONS = 10;
const SETTLE_ITERATIONS = 25;
const COST_TOLERANCE = 1e-6;
const MAX_STEPS_PER_FRAME = 4;
const MAX_TRAIL_POINTS = 500;
const MAX_HISTORY_POINTS = 500;

export interface TrailPoint {
  px: number;
  py: number;
}

export interface HistoryPoint {
  t: number;
  thrust: number;
  torque: number;
  fuel: number;
  gForce: number;
}

function rtiOptions(weights: CostWeights, iterations: number) {
  return { dt: DT, horizonSteps: HORIZON_STEPS, weights, iterations, costTolerance: COST_TOLERANCE };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface RocketLandingState {
  weights: CostWeights;

  // The staged initial condition -- px0/py0 come from dragging the rocket, theta0/vy0 from
  // sliders. Any change here re-anchors the live sim via resetTo().
  px0: number;
  py0: number;
  theta0: number;
  vy0: number;
  activePresetId: string | null;

  rti: RtiState;
  lastAppliedControl: Vector;
  solverConverged: boolean;
  solverIterations: number;
  elapsedTime: number;
  frameAccumulator: number;
  trail: TrailPoint[];
  history: HistoryPoint[];
  /** Cost after each accepted iLQR forward pass of the most recent solve (a fuller settle solve
   * while paused, or the latest live tick while playing) -- for the "iLQR cost vs. iteration"
   * chart. */
  lastCostHistory: number[];

  isPlaying: boolean;
  isDragging: boolean;

  setWeight: <K extends keyof CostWeights>(key: K, value: CostWeights[K]) => void;
  setTheta0: (theta0: number) => void;
  setVy0: (vy0: number) => void;
  applyPreset: (id: string) => void;
  beginDrag: () => void;
  dragTo: (px: number, py: number) => void;
  endDrag: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  reset: () => void;
  tick: (deltaSeconds: number) => void;
}

function buildRealState(px0: number, py0: number, theta0: number, vy0: number): Vector {
  return [px0, py0, theta0, 0, vy0, 0];
}

/** (Re)builds the live RtiState from the staged (px0,py0,theta0,vy0): cold-starts the horizon,
 * then runs a fuller settle solve (SETTLE_ITERATIONS, not just LIVE_ITERATIONS) so the predicted
 * trajectory preview already looks converged before the student presses Play -- same idea as the
 * plan's "fuller solve while paused" strategy, applied once at setup time. This does not advance
 * the real state (unlike rtiSim.step) -- it only replaces the preview trajectory. Also returns
 * that settle solve's costHistory, for the "iLQR cost vs. iteration" chart. */
function freshRti(
  px0: number,
  py0: number,
  theta0: number,
  vy0: number,
  weights: CostWeights,
): { rti: RtiState; costHistory: number[] } {
  const x0 = buildRealState(px0, py0, theta0, vy0);
  const cold = initialRtiState(x0, rtiOptions(weights, 0), DEFAULT_FUEL);
  const settleResult = solve(x0, coldStartTrajectory(x0, HORIZON_STEPS, DT), {
    dt: DT,
    weights,
    maxIterations: SETTLE_ITERATIONS,
    costTolerance: COST_TOLERANCE,
  });
  return { rti: { ...cold, nominalTrajectory: settleResult.trajectory }, costHistory: settleResult.costHistory };
}

export const useRocketLandingStore = create<RocketLandingState>((set, get) => {
  const initialPreset = SCENARIO_PRESETS[0];
  const initialFresh = freshRti(
    initialPreset.px0,
    initialPreset.py0,
    initialPreset.theta0,
    initialPreset.vy0,
    DEFAULT_WEIGHTS,
  );

  return {
    weights: { ...DEFAULT_WEIGHTS },
    px0: initialPreset.px0,
    py0: initialPreset.py0,
    theta0: initialPreset.theta0,
    vy0: initialPreset.vy0,
    activePresetId: initialPreset.id,

    rti: initialFresh.rti,
    lastAppliedControl: [0, 0],
    solverConverged: true,
    solverIterations: 0,
    elapsedTime: 0,
    frameAccumulator: 0,
    trail: [],
    history: [],
    lastCostHistory: initialFresh.costHistory,

    isPlaying: false,
    isDragging: false,

    setWeight: (key, value) => set((s) => ({ weights: { ...s.weights, [key]: value } })),

    setTheta0: (theta0) => {
      const { px0, py0, vy0, weights } = get();
      const fresh = freshRti(px0, py0, theta0, vy0, weights);
      set({
        theta0,
        activePresetId: null,
        isPlaying: false,
        rti: fresh.rti,
        elapsedTime: 0,
        trail: [],
        history: [],
        lastCostHistory: fresh.costHistory,
      });
    },

    setVy0: (vy0) => {
      const { px0, py0, theta0, weights } = get();
      const fresh = freshRti(px0, py0, theta0, vy0, weights);
      set({
        vy0,
        activePresetId: null,
        isPlaying: false,
        rti: fresh.rti,
        elapsedTime: 0,
        trail: [],
        history: [],
        lastCostHistory: fresh.costHistory,
      });
    },

    applyPreset: (id) => {
      const preset = SCENARIO_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      const { weights } = get();
      const fresh = freshRti(preset.px0, preset.py0, preset.theta0, preset.vy0, weights);
      set({
        px0: preset.px0,
        py0: preset.py0,
        theta0: preset.theta0,
        vy0: preset.vy0,
        activePresetId: id,
        isPlaying: false,
        rti: fresh.rti,
        elapsedTime: 0,
        trail: [],
        history: [],
        lastCostHistory: fresh.costHistory,
      });
    },

    beginDrag: () => set({ isDragging: true, isPlaying: false }),

    dragTo: (px, py) => {
      const { theta0, vy0, weights } = get();
      const px0 = clamp(px, DRAG_BOUNDS.pxMin, DRAG_BOUNDS.pxMax);
      const py0 = clamp(py, DRAG_BOUNDS.pyMin, DRAG_BOUNDS.pyMax);
      const fresh = freshRti(px0, py0, theta0, vy0, weights);
      set({
        px0,
        py0,
        activePresetId: null,
        rti: fresh.rti,
        elapsedTime: 0,
        trail: [],
        history: [],
        lastCostHistory: fresh.costHistory,
      });
    },

    endDrag: () => set({ isDragging: false }),

    play: () => {
      if (get().rti.landingStatus !== 'flying') return;
      set({ isPlaying: true });
    },
    pause: () => set({ isPlaying: false }),
    togglePlay: () => (get().isPlaying ? get().pause() : get().play()),

    reset: () => {
      const { px0, py0, theta0, vy0, weights } = get();
      const fresh = freshRti(px0, py0, theta0, vy0, weights);
      set({
        isPlaying: false,
        rti: fresh.rti,
        elapsedTime: 0,
        trail: [],
        history: [],
        lastCostHistory: fresh.costHistory,
      });
    },

    tick: (deltaSeconds) => {
      if (!get().isPlaying) return;
      set((s) => ({ frameAccumulator: s.frameAccumulator + deltaSeconds }));

      let stepsRun = 0;
      while (get().frameAccumulator >= DT && stepsRun < MAX_STEPS_PER_FRAME) {
        const { rti, weights, elapsedTime, trail, history } = get();
        if (rti.landingStatus !== 'flying') {
          set({ isPlaying: false, frameAccumulator: 0 });
          break;
        }

        const result = step(rti, rtiOptions(weights, LIVE_ITERATIONS));
        const t = elapsedTime + DT;
        const [px, py] = result.next.realState;
        const [T, tau] = result.appliedControl;
        // Specific force felt along the body axis, in g's -- thrust is the only non-gravitational
        // force this planar model applies, so this is just T/mass normalized by G.
        const gForce = T / MASS / G;

        const nextTrail = [...trail, { px, py }].slice(-MAX_TRAIL_POINTS);
        const nextHistory = [...history, { t, thrust: T, torque: tau, fuel: result.next.fuelRemaining, gForce }].slice(
          -MAX_HISTORY_POINTS,
        );

        set((s) => ({
          rti: result.next,
          lastAppliedControl: result.appliedControl,
          solverConverged: result.solverConverged,
          solverIterations: result.solverIterations,
          elapsedTime: t,
          frameAccumulator: s.frameAccumulator - DT,
          trail: nextTrail,
          history: nextHistory,
          isPlaying: result.next.landingStatus === 'flying',
          // Keep the last non-empty convergence curve visible (a tick right at/after touchdown
          // returns an empty costHistory since no solve ran) rather than blanking the chart.
          lastCostHistory: result.costHistory.length > 0 ? result.costHistory : s.lastCostHistory,
        }));

        stepsRun++;
      }
    },
  };
});
