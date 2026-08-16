import { useCarShocksStore } from '../store/carShocksStore.ts';

/**
 * Subscribes to currentTime but only triggers a re-render when it crosses a coarser step
 * boundary. Cheap to re-render on (a native range input + text node), so this stays live
 * during playback — unlike useChartPlayheadTime below.
 */
export function useThrottledTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useCarShocksStore((s) => Math.round(s.currentTime / step) * step);
}

/** Sentinel returned while playing — see doc comment below. */
export const PLAYHEAD_FROZEN = -1;

/**
 * Subscribes to currentTime for driving a Recharts playhead marker, but freezes entirely
 * while playback is active (returns the constant PLAYHEAD_FROZEN, so the Zustand selector
 * reports "no change" every tick and the subscribing component never re-renders during
 * playback). A live-updating Recharts marker at 5-20Hz causes visible frame drops (full
 * axis/grid/legend relayout per tick, not just the moving element) — same profiling result as
 * the other demos' copy of this file. The car-body canvas reads currentTime imperatively every
 * animation frame and is unaffected; only chart playhead markers pause during active playback,
 * resuming the moment playback is paused or scrubbed.
 */
export function useChartPlayheadTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useCarShocksStore((s) =>
    s.isPlaying ? PLAYHEAD_FROZEN : Math.round(s.currentTime / step) * step,
  );
}
