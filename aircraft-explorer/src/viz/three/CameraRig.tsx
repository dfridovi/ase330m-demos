import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * Orbit controls that follow a moving target horizontally: the user's chosen offset/orbit/
 * zoom is preserved, but the rig translates each frame by the target's horizontal (X/Z)
 * delta motion, so the camera chases the airplane instead of watching it fly out of frame.
 *
 * Deliberately does NOT chase vertical (Y) motion. Real horizontal distance can reach
 * kilometers, so it must be chased to keep the plane in frame at all — but altitude changes
 * are exactly the thing this animation exists to show. If the camera also chased Y, it would
 * re-center on the plane vertically every frame, canceling out the climb/dive motion (the
 * plane would always appear at the same screen height regardless of real altitude) in
 * exactly the same way a ground plane that tracked altitude 1:1 did in an earlier version of
 * this component. Leaving Y alone lets a climb/dive show up as real relative motion against
 * a vertically-stable camera and ground.
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
