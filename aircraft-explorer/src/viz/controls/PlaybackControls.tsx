import { useSimulationStore } from '../../store/simulationStore.ts';
import { useThrottledTime } from '../useThrottledTime.ts';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function PlaybackControls() {
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  // Throttled: a progress readout doesn't need to re-render at full animation-frame rate, and
  // doing so was adding an extra React commit competing with the WebGL render every frame.
  const currentTime = useThrottledTime(20);
  const setCurrentTime = useSimulationStore((s) => s.setCurrentTime);
  const tSpan = useSimulationStore((s) => s.activeTSpan());
  const speed = useSimulationStore((s) => s.speed);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  return (
    <div className="playback-controls">
      <button type="button" className="play-button" onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        className="scrub"
        min={tSpan[0]}
        max={tSpan[1]}
        step={0.01}
        value={currentTime}
        onChange={(e) => setCurrentTime(Number(e.target.value))}
      />
      <span className="time-readout">
        {currentTime.toFixed(1)} / {tSpan[1].toFixed(0)} s
      </span>
      <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  );
}
