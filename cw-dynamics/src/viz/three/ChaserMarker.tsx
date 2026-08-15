import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useCwStore } from '../../store/cwStore';
import { propagate } from '../../core/dynamics/cw';
import { toRenderPosition } from './coords';
import { SERIES_FULL } from '../charts/theme';

export function ChaserMarker({ groupRef }: { groupRef: React.RefObject<Group | null> }) {
  useFrame(() => {
    const { x0, n, currentTime } = useCwStore.getState();
    const state = propagate(x0, n, currentTime);
    const [x, y, z] = toRenderPosition(state);
    groupRef.current?.position.set(x, y, z);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={SERIES_FULL} />
      </mesh>
    </group>
  );
}
