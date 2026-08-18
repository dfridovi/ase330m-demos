import { useControlStore } from '../store/controlStore.ts';

/**
 * Subscribes to currentTime but only triggers a re-render when it crosses a coarser step
 * boundary. Cheap to re-render on (a native range input + text node), so this stays live
 * during playback — unlike useChartPlayheadTime below.
 */
export function useThrottledTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useControlStore((s) => Math.round(s.currentTime / step) * step);
}

/** Sentinel returned while playing — see doc comment below. */
export const PLAYHEAD_FROZEN = -1;

/**
 * Subscribes to currentTime for driving a Recharts playhead marker, but freezes entirely
 * while playback is active (returns the constant PLAYHEAD_FROZEN) — see aircraft-explorer's
 * identical helper for the profiling rationale (a Recharts re-render at animation-frame rate
 * caused severe frame drops in Safari). Resumes updating live the moment playback pauses or
 * the scrub bar is dragged.
 */
export function useChartPlayheadTime(stepsPerSecond = 5): number {
  const step = 1 / stepsPerSecond;
  return useControlStore((s) => (s.isPlaying ? PLAYHEAD_FROZEN : Math.round(s.currentTime / step) * step));
}
