import { useSimulationStore } from '../store/simulationStore.ts';

/**
 * Subscribes to currentTime but only triggers a re-render when it crosses a coarser step
 * boundary. Cheap to re-render on (a native range input + text node), so this stays live
 * during playback — unlike useChartPlayheadTime below.
 */
export function useThrottledTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useSimulationStore((s) => Math.round(s.currentTime / step) * step);
}

/** Sentinel returned while playing — see doc comment below. */
export const PLAYHEAD_FROZEN = -1;

/**
 * Subscribes to currentTime for driving a Recharts playhead marker, but freezes entirely
 * while playback is active (returns the constant PLAYHEAD_FROZEN, so the Zustand selector
 * reports "no change" every tick and the subscribing component never re-renders during
 * playback).
 *
 * This looks aggressive, but profiling (a Safari Web Inspector timeline capture) showed even
 * a 5-20Hz re-render of a Recharts line chart — axes/grid/tooltip/legend all re-run their
 * layout, not just the one moving element — was enough to cause severe, sustained frame
 * drops in Safari (55-110ms per animation frame, not occasional GC blips), repeated across
 * every chart panel. The 3D scene's own animation reads currentTime imperatively every frame
 * and is unaffected; only these Recharts-driven "where are we in time" markers pause during
 * active playback, and resume updating live the moment playback is paused or the scrub bar
 * is dragged.
 */
export function useChartPlayheadTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useSimulationStore((s) => (s.isPlaying ? PLAYHEAD_FROZEN : Math.round(s.currentTime / step) * step));
}
