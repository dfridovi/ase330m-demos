import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useRendezvousStore } from '../../store/rendezvousStore';
import { sampleTrajectory } from '../../core/sim/interpolate';
import { toRenderPosition } from './coords';
import { SERIES_CURRENT } from '../charts/theme';

export function ChaserMarker({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  const stateSample = useRef<number[]>([0, 0, 0, 0, 0, 0]);

  useFrame(() => {
    const { current, currentTime } = useRendezvousStore.getState();
    const sample = sampleTrajectory(current.trajectory, currentTime, stateSample.current);
    const [x, y, z] = toRenderPosition(sample[0], sample[1], sample[2]);
    groupRef.current?.position.set(x, y, z);
  });

  return (
    <group ref={groupRef}>
      {/* A stylized marker size, like the chief's -- real spacecraft are meters across, which
          would be invisible at this scene's ~10-20 render-unit (1-2km) framing. */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={SERIES_CURRENT} />
      </mesh>
    </group>
  );
}
