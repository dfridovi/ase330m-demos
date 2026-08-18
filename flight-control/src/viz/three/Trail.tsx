import { Trail as DreiTrail } from '@react-three/drei';
import type { Group, Object3D } from 'three';
import { SERIES_FULL } from '../charts/theme.ts';

// drei's Trail buffers `length * 10` points, pushing a new one every `interval` frames
// (~30Hz at interval=2 on a 60fps display), so duration in seconds ~= (length*10)/30.
// length=30 -> ~10s of trailing history.
export function Trail({ targetRef }: { targetRef: React.RefObject<Group | null> }) {
  return (
    <DreiTrail
      width={4}
      length={30}
      interval={2}
      color={SERIES_FULL}
      attenuation={(t) => t}
      target={targetRef as React.RefObject<Object3D>}
    >
      <mesh visible={false}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
      </mesh>
    </DreiTrail>
  );
}
