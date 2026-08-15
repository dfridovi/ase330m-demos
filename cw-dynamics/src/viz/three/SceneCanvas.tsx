import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Group } from 'three';
import { ChaserMarker } from './ChaserMarker';
import { CameraRig } from './CameraRig';
import { Trail } from './Trail';
import { StaticOrbitPaths } from './StaticOrbitPaths';
import { CHART_SURFACE, TEXT_MUTED } from '../charts/theme';
import { useCwStore } from '../../store/cwStore';

export function SceneCanvas() {
  const chaserGroupRef = useRef<Group>(null);
  const resetToken = useCwStore((s) => s.resetToken);

  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 45 }} style={{ background: CHART_SURFACE }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1.2} />
      {/* Lies in the render X/Z plane = physical radial/along-track: the orbital plane. */}
      <Grid infiniteGrid followCamera cellColor="#383835" sectionColor="#52514e" fadeDistance={40} cellSize={0.5} sectionSize={2} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={TEXT_MUTED} />
      </mesh>
      <StaticOrbitPaths key={`paths-${resetToken}`} />
      <ChaserMarker key={`chaser-${resetToken}`} groupRef={chaserGroupRef} />
      <Trail key={`trail-${resetToken}`} targetRef={chaserGroupRef} />
      <CameraRig targetRef={chaserGroupRef} />
    </Canvas>
  );
}
