import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Group } from 'three';
import { AnimatedAirplane } from './AnimatedAirplane.tsx';
import { CameraRig } from './CameraRig.tsx';
import { Trail } from './Trail.tsx';
import { CHART_SURFACE } from '../charts/theme.ts';
import { useSimulationStore } from '../../store/simulationStore.ts';

// A static offset, not a lockstep tracker: the ground previously tracked the airplane's
// altitude 1:1 every frame, which "fixed" clipping but also meant the vertical gap between
// plane and ground never changed — killing the very climb/dive motion it was supposed to
// show. A fixed offset lets the plane genuinely move relative to the ground, sized (jointly
// with ALTITUDE_SCALE in AnimatedAirplane.tsx) to comfortably contain the tuned default
// altitude swing (~+-5.5 render units) while staying within the camera's natural framing.
const GROUND_OFFSET = -7;

export function SceneCanvas() {
  const airplaneGroupRef = useRef<Group>(null);
  const resetToken = useSimulationStore((s) => s.resetToken);

  return (
    <Canvas
      camera={{ position: [-18, 6, 14], fov: 40 }}
      style={{ background: CHART_SURFACE }}
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1.2} />
      <Grid
        infiniteGrid
        followCamera
        cellColor="#383835"
        sectionColor="#52514e"
        fadeDistance={200}
        cellSize={5}
        sectionSize={25}
        position={[0, GROUND_OFFSET, 0]}
      />
      {/* Keyed on resetToken so the trail buffer clears whenever the trajectory jumps
          discontinuously (preset/input-mode change, playback loop), instead of smearing. */}
      <AnimatedAirplane key={`plane-${resetToken}`} groupRef={airplaneGroupRef} />
      <Trail key={`trail-${resetToken}`} targetRef={airplaneGroupRef} />
      <CameraRig targetRef={airplaneGroupRef} />
    </Canvas>
  );
}
