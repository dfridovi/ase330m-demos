import { OrbitControls } from '@react-three/drei';

/**
 * Plain user-controlled orbit camera -- no per-frame chaser-following (unlike
 * cw-dynamics/src/viz/three/CameraRig.tsx, which chases an ever-drifting chaser that can run
 * off to infinity). This demo's chaser instead converges toward a *fixed* point (the chief at
 * the origin), so a camera that recenters on the chaser would carry the chief and capture
 * sphere off-screen right when they matter most -- SceneCanvas instead picks a static initial
 * distance wide enough to frame the whole initial-condition slider range, and leaves it to the
 * user to zoom/orbit from there.
 */
export function CameraRig() {
  return <OrbitControls enableDamping dampingFactor={0.1} />;
}
