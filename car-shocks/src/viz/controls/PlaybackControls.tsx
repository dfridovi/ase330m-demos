import { useCarShocksStore } from '../../store/carShocksStore.ts';
import { useThrottledTime } from '../useThrottledTime.ts';

const SPEEDS = [0.25, 0.5, 1, 2];

export function PlaybackControls() {
  const activeTab = useCarShocksStore((s) => s.activeTab);
  const isPlaying = useCarShocksStore((s) => s.isPlaying);
  const togglePlay = useCarShocksStore((s) => s.togglePlay);
  const currentTime = useThrottledTime(30);
  const setCurrentTime = useCarShocksStore((s) => s.setCurrentTime);
  const tEndPeriodic = useCarShocksStore((s) => s.tEndPeriodic);
  const tEndSettle = useCarShocksStore((s) => s.tEndSettle);
  const speed = useCarShocksStore((s) => s.speed);
  const setSpeed = useCarShocksStore((s) => s.setSpeed);

  if (activeTab === 'frequency') {
    return (
      <div className="playback-controls">
        <span className="time-readout">
          Frequency-domain view — adjust ω above to move the marker on the charts below.
        </span>
      </div>
    );
  }

  const tEnd = activeTab === 'periodic' ? tEndPeriodic : tEndSettle;

  return (
    <div className="playback-controls">
      <button type="button" className="play-button" onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        className="scrub"
        min={0}
        max={tEnd}
        step={tEnd / 2000}
        value={currentTime}
        onChange={(e) => setCurrentTime(Number(e.target.value))}
      />
      <span className="time-readout">
        {currentTime.toFixed(2)} / {tEnd.toFixed(2)} s
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
