import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useSimulationStore } from '../../store/simulationStore.ts';
import { sampleTrajectory } from '../../core/sim/interpolate.ts';
import { AIRFRAME_PRESETS, GENERAL_AVIATION } from '../../core/aero/presets.ts';
import { wingSpan as computeWingSpan } from '../../core/types/aircraft.ts';
import { Airplane } from './Airplane.tsx';

// Chosen jointly with the ground plane's (static) offset in SceneCanvas.tsx: the camera's
// natural framing only shows roughly +-8-9 render units of vertical range around the
// airplane, so the render-space altitude swing has to fit comfortably inside that regardless
// of the model's real altitude swing (tuned to ~+-18m for both presets) — otherwise either
// the ground goes out of frame (too generous a scale) or the plane visibly punches through it
// (too aggressive a scale). 0.3 keeps the render swing to roughly +-5.5 units.
const ALTITUDE_SCALE = 0.3;

// Real horizontal distance easily reaches tens of kilometers over a run (more so for faster
// aircraft and longer playback windows — e.g. the Fighter preset at ~200 m/s over its 210s
// window, vs GA's ~54 m/s over 60s). Since the camera chases the airplane, letting world
// coordinates grow large causes visible float32 precision jitter (a well-known WebGL/Three.js
// issue at large coordinate magnitudes) — worse, and sooner, the faster/longer the run.
// Compressing horizontal distance keeps everything near the origin (even the longest preset,
// Fighter High Altitude at ~64km over 320s, stays under ~3200 render units) while preserving
// the *relative* speed comparison between presets (all scaled by the same factor).
const DISTANCE_SCALE = 0.05;

export function AnimatedAirplane({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const physicalParams = useSimulationStore((s) => s.physicalParams);
  const meanChord = physicalParams.meanChord;
  const presetId = useSimulationStore((s) => s.presetId);
  const wingSpan = computeWingSpan(physicalParams);
  const style = (AIRFRAME_PRESETS.find((p) => p.id === presetId) ?? GENERAL_AVIATION).visualStyle;

  // Reused every frame so sampling the trajectory doesn't allocate a new array 60+ times/sec.
  // Sized for 3 elements to cover both longitudinal's [x, altitude] and lateral's [x, z, psi]
  // position samples — an unused 3rd slot is harmless for the longitudinal case.
  const stateSample = useRef<number[]>([0, 0, 0, 0]);
  const positionSample = useRef<number[]>([0, 0, 0]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const state = useSimulationStore.getState();
    const response = state.activeResponse();
    const kinematics = state.activeKinematics();

    const sample = sampleTrajectory(response, state.currentTime, stateSample.current);
    const posSample = sampleTrajectory(kinematics.positionTrajectory, state.currentTime, positionSample.current);

    if (state.activeAxis === 'lateral') {
      // Ground track lives in the horizontal X/Z plane (fixed altitude) instead of X/Y.
      // Bank (phi) rolls the model about its own local roll axis (local X, per Airplane.tsx's
      // nose-along-+X convention); heading (psi) yaws it about the local vertical axis, which
      // is the model's local -Y given that same convention (hence the sign flip below).
      const phi = sample[3];
      const psi = posSample[2];
      group.position.set(posSample[0] * DISTANCE_SCALE, 0, posSample[1] * DISTANCE_SCALE);
      group.rotation.set(phi, -psi, 0);
    } else {
      const theta = sample[3];
      group.position.set(posSample[0] * DISTANCE_SCALE, posSample[1] * ALTITUDE_SCALE, 0);
      group.rotation.set(0, 0, theta);
    }
  });

  return (
    <group ref={groupRef}>
      <Airplane geometry={{ wingSpan, meanChord, style }} />
    </group>
  );
}
