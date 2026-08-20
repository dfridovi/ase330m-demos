import { CAPTURE_RING } from '../charts/theme';

// A literal-scale CAPTURE_THRESHOLD_M=5m sphere would be ~0.05 render units -- invisible next
// to a scene framed for a ~1-1.5km initial offset. Like the chief/chaser markers, this is a
// stylized "here's the target" marker, not a to-scale rendering; the actual threshold value is
// in the distance-to-target chart and the 2D view's capture circle (drawn to scale there since
// that view zooms to the final approach).
const VISUAL_RADIUS = 0.4;

/** A translucent sphere centered on the chief -- "close enough" as a visible target, not just
 * a number in a chart. */
export function CaptureSphere() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[VISUAL_RADIUS, 24, 24]} />
      <meshStandardMaterial color={CAPTURE_RING} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}
