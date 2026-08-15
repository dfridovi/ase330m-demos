import { useCwStore } from '../../store/cwStore';
import { useThrottledTime } from '../useThrottledTime';

const SPEEDS = [50, 100, 200, 400, 800];

function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

export function PlaybackControls() {
  const isPlaying = useCwStore((s) => s.isPlaying);
  const togglePlay = useCwStore((s) => s.togglePlay);
  const currentTime = useThrottledTime(20);
  const setCurrentTime = useCwStore((s) => s.setCurrentTime);
  const tSpan = useCwStore((s) => s.tSpan);
  const speed = useCwStore((s) => s.speed);
  const setSpeed = useCwStore((s) => s.setSpeed);

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
        step={tSpan[1] / 2000}
        value={currentTime}
        onChange={(e) => setCurrentTime(Number(e.target.value))}
      />
      <span className="time-readout">
        {formatHours(currentTime)} / {formatHours(tSpan[1])} hr
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
