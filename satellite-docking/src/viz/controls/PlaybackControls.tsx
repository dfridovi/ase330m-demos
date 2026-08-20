import { useRendezvousStore } from '../../store/rendezvousStore';
import { useThrottledTime } from '../useThrottledTime';

const SPEEDS = [5, 10, 20, 40, 80];

export function PlaybackControls() {
  const isPlaying = useRendezvousStore((s) => s.isPlaying);
  const togglePlay = useRendezvousStore((s) => s.togglePlay);
  const currentTime = useThrottledTime(20);
  const setCurrentTime = useRendezvousStore((s) => s.setCurrentTime);
  const tSpan = useRendezvousStore((s) => s.tSpan);
  const speed = useRendezvousStore((s) => s.speed);
  const setSpeed = useRendezvousStore((s) => s.setSpeed);

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
        {currentTime.toFixed(0)} / {tSpan[1].toFixed(0)} s
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
