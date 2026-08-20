import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { Group } from 'three';
import { ChaserMarker } from './ChaserMarker';
import { GhostMarker } from './GhostMarker';
import { TrajectoryPath } from './TrajectoryPath';
import { BurnArrow } from './BurnArrow';
import { CaptureSphere } from './CaptureSphere';
import { CameraRig } from './CameraRig';
import { CHART_SURFACE, SERIES_CURRENT, SERIES_NAIVE, SERIES_OPEN_LOOP, SERIES_TUNED, TEXT_MUTED } from '../charts/theme';
import { useRendezvousStore } from '../../store/rendezvousStore';

export function SceneCanvas() {
  const chaserGroupRef = useRef<Group>(null);
  const resetToken = useRendezvousStore((s) => s.resetToken);
  const naive = useRendezvousStore((s) => s.naive);
  const tuned = useRendezvousStore((s) => s.tuned);
  const openLoop = useRendezvousStore((s) => s.openLoop);
  const current = useRendezvousStore((s) => s.current);

  return (
    // Position sized to frame the full initial-condition slider range (up to ~1.5km
    // along-track = 15 render units) from outside it -- see CameraRig.tsx for why this is a
    // static wide shot rather than a chaser-following rig. Deliberately X-dominant (not
    // Z-dominant): along-track (render Z) is the biggest and most common motion axis (the
    // default trailing preset is pure along-track), and a camera looking nearly down that
    // axis foreshortens it -- and the burn arrow, which mostly points along it too -- into a
    // barely-visible sliver. Favoring the X offset keeps along-track motion reading as a clear
    // span across the screen instead of into it.
    <Canvas camera={{ position: [20, 10, 8], fov: 50 }} style={{ background: CHART_SURFACE }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 25, 15]} intensity={1.2} />
      {/* Lies in the render X/Z plane = physical radial/along-track: the orbital plane. */}
      <Grid infiniteGrid followCamera cellColor="#383835" sectionColor="#52514e" fadeDistance={100} cellSize={2} sectionSize={10} />
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={TEXT_MUTED} />
      </mesh>
      <CaptureSphere key={`capture-${resetToken}`} />

      {/* Reference overlays: uncontrolled baseline and the two hardcoded gains, same colors as
          the charts and the 2D view. */}
      <TrajectoryPath key={`path-open-${resetToken}`} trajectory={openLoop.trajectory} color={SERIES_OPEN_LOOP} dashed opacity={0.5} />
      <TrajectoryPath key={`path-naive-${resetToken}`} trajectory={naive.trajectory} color={SERIES_NAIVE} dashed opacity={0.6} />
      <TrajectoryPath key={`path-tuned-${resetToken}`} trajectory={tuned.trajectory} color={SERIES_TUNED} dashed opacity={0.6} />
      <GhostMarker key={`ghost-open-${resetToken}`} trajectory={openLoop.trajectory} color={SERIES_OPEN_LOOP} />
      <GhostMarker key={`ghost-naive-${resetToken}`} trajectory={naive.trajectory} color={SERIES_NAIVE} />
      <GhostMarker key={`ghost-tuned-${resetToken}`} trajectory={tuned.trajectory} color={SERIES_TUNED} />

      {/* The student's own trajectory: solid, full-opacity, on top. */}
      <TrajectoryPath key={`path-current-${resetToken}`} trajectory={current.trajectory} color={SERIES_CURRENT} />
      <ChaserMarker key={`chaser-${resetToken}`} groupRef={chaserGroupRef} />
      <BurnArrow key={`burn-${resetToken}`} />
      <CameraRig />
    </Canvas>
  );
}
