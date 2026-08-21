import { useRocketLandingStore } from '../../store/rocketLandingStore.ts';

const STATUS_LABEL: Record<string, string> = {
  flying: 'Flying',
  landed: 'Landed',
  crashed: 'Crashed',
};

export function PlaybackControls() {
  const isPlaying = useRocketLandingStore((s) => s.isPlaying);
  const togglePlay = useRocketLandingStore((s) => s.togglePlay);
  const reset = useRocketLandingStore((s) => s.reset);
  const landingStatus = useRocketLandingStore((s) => s.rti.landingStatus);
  const elapsedTime = useRocketLandingStore((s) => s.elapsedTime);

  return (
    <div className="playback-controls">
      <button type="button" className="play-button" onClick={togglePlay} disabled={landingStatus !== 'flying'}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button type="button" className="preset-button" onClick={reset}>
        Reset
      </button>
      <span className="time-readout">{elapsedTime.toFixed(1)} s</span>
      <span className={`status-badge status-${landingStatus}`}>{STATUS_LABEL[landingStatus]}</span>
    </div>
  );
}
