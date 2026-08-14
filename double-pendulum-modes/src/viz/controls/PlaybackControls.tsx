import { usePendulumStore } from '../../store/pendulumStore.ts';
import { useThrottledTime } from '../useThrottledTime.ts';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export function PlaybackControls() {
  const isPlaying = usePendulumStore((s) => s.isPlaying);
  const togglePlay = usePendulumStore((s) => s.togglePlay);
  const currentTime = useThrottledTime(20);
  const setCurrentTime = usePendulumStore((s) => s.setCurrentTime);
  const tSpan = usePendulumStore((s) => s.tSpan);
  const speed = usePendulumStore((s) => s.speed);
  const setSpeed = usePendulumStore((s) => s.setSpeed);

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
        {currentTime.toFixed(1)} / {tSpan[1].toFixed(1)} s
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
