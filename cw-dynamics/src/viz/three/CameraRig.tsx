import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * Orbit controls that follow the chaser horizontally (render X/Z, i.e. physical radial/
 * along-track): the user's chosen offset/orbit/zoom is preserved, but the rig translates each
 * frame by the target's horizontal delta motion, so a large along-track drift never carries the
 * chaser out of frame.
 *
 * Deliberately does NOT chase vertical (render Y = physical cross-track) motion, for the same
 * reason aircraft-explorer's camera doesn't chase altitude: that's exactly the out-of-plane
 * motion this view exists to show, and chasing it would cancel it out on screen.
 */
export function CameraRig({ targetRef }: { targetRef: React.RefObject<Group | null> }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const previousTarget = useRef(new Vector3());
  const delta = useRef(new Vector3());

  useFrame(() => {
    const target = targetRef.current;
    const controls = controlsRef.current;
    if (!target || !controls) return;
    delta.current.subVectors(target.position, previousTarget.current);
    delta.current.y = 0;
    camera.position.add(delta.current);
    controls.target.add(delta.current);
    previousTarget.current.copy(target.position);
    controls.update();
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} />;
}
