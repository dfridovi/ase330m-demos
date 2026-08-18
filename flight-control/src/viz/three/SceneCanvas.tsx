import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Group } from 'three';
import { AnimatedAirplane } from './AnimatedAirplane.tsx';
import { CameraRig } from './CameraRig.tsx';
import { Trail } from './Trail.tsx';
import { CHART_SURFACE } from '../charts/theme.ts';
import { useControlStore } from '../../store/controlStore.ts';

// See aircraft-explorer's identical constant for the render-space framing rationale.
const GROUND_OFFSET = -7;

export function SceneCanvas() {
  const airplaneGroupRef = useRef<Group>(null);
  const resetToken = useControlStore((s) => s.resetToken);

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
          discontinuously (maneuver/gain change, playback loop), instead of smearing. */}
      <AnimatedAirplane key={`plane-${resetToken}`} groupRef={airplaneGroupRef} />
      <Trail key={`trail-${resetToken}`} targetRef={airplaneGroupRef} />
      <CameraRig targetRef={airplaneGroupRef} />
    </Canvas>
  );
}
