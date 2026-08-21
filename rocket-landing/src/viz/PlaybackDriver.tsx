import { useEffect } from 'react';
import { useRocketLandingStore } from '../store/rocketLandingStore.ts';

/** Headless component: drives the closed-loop sim clock via requestAnimationFrame. */
export function PlaybackDriver() {
  useEffect(() => {
    let frameId: number;
    let lastTimestamp: number | null = null;

    const loop = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSeconds = (timestamp - lastTimestamp) / 1000;
        useRocketLandingStore.getState().tick(deltaSeconds);
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return null;
}
