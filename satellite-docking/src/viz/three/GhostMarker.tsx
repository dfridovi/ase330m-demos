import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Trajectory } from '../../core/sim/rk4';
import { useRendezvousStore } from '../../store/rendezvousStore';
import { sampleTrajectory } from '../../core/sim/interpolate';
import { toRenderPosition } from './coords';

interface GhostMarkerProps {
  trajectory: Trajectory;
  color: string;
  radius?: number;
  opacity?: number;
}

/** A reference-gain or open-loop "ghost" satellite: same idea as ChaserMarker (sample position
 * at currentTime every frame), smaller and translucent so the student's own chaser stays the
 * visually dominant object. */
export function GhostMarker({ trajectory, color, radius = 0.2, opacity = 0.55 }: GhostMarkerProps) {
  const groupRef = useRef<Group>(null);
  const sample = useRef<number[]>([0, 0, 0, 0, 0, 0]);

  useFrame(() => {
    const { currentTime } = useRendezvousStore.getState();
    const s = sampleTrajectory(trajectory, currentTime, sample.current);
    const [x, y, z] = toRenderPosition(s[0], s[1], s[2]);
    groupRef.current?.position.set(x, y, z);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}
