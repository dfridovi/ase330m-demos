import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useControlStore } from '../../store/controlStore.ts';
import { sampleTrajectory } from '../../core/sim/interpolate.ts';
import { GENERAL_AVIATION } from '../../core/aero/presets.ts';
import { wingSpan as computeWingSpan } from '../../core/types/aircraft.ts';
import { Airplane } from './Airplane.tsx';

// Chosen jointly with the ground plane's (static) offset in SceneCanvas.tsx — see
// aircraft-explorer's identical constant for the render-space framing rationale.
const ALTITUDE_SCALE = 0.3;
const DISTANCE_SCALE = 0.05;

export function AnimatedAirplane({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const meanChord = GENERAL_AVIATION.defaultParams.meanChord;
  const wingSpan = computeWingSpan(GENERAL_AVIATION.defaultParams);
  const style = GENERAL_AVIATION.visualStyle;

  const stateSample = useRef<number[]>([0, 0, 0, 0]);
  const positionSample = useRef<number[]>([0, 0]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const state = useControlStore.getState();

    // No extra "diverged" clamp needed here: simulateStateFeedback already truncates the
    // trajectory the instant its norm blows up (see closedLoopSim.ts), and sampleTrajectory
    // clamps any t past the trajectory's end to its last sample — so playback naturally
    // freezes on the last pre-divergence pose instead of animating a runaway or NaN state.
    const sample = sampleTrajectory(state.trajectory, state.currentTime, stateSample.current);
    const posSample = sampleTrajectory(state.kinematics.positionTrajectory, state.currentTime, positionSample.current);

    const theta = sample[3];
    group.position.set(posSample[0] * DISTANCE_SCALE, posSample[1] * ALTITUDE_SCALE, 0);
    group.rotation.set(0, 0, theta);
  });

  return (
    <group ref={groupRef}>
      <Airplane geometry={{ wingSpan, meanChord, style }} />
    </group>
  );
}
