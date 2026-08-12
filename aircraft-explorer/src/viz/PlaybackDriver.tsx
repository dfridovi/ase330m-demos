import { useEffect } from 'react';
import { useSimulationStore } from '../store/simulationStore.ts';

/** Headless component: drives the playback clock via requestAnimationFrame. */
export function PlaybackDriver() {
  useEffect(() => {
    let frameId: number;
    let lastTimestamp: number | null = null;

    const loop = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSeconds = (timestamp - lastTimestamp) / 1000;
        useSimulationStore.getState().tick(deltaSeconds);
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return null;
}
