import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ArrowHelper, Vector3 } from 'three';
import { useRendezvousStore } from '../../store/rendezvousStore';
import { sampleTrajectory } from '../../core/sim/interpolate';
import { toRenderPosition } from './coords';
import { BURN_ARROW } from '../charts/theme';

// Render-unit arrow length per (m/s^2) of |u| -- same intent as RendezvousCanvas2D's
// METERS_SCALE_2D, tuned independently for this scene's render scale (1 unit = 100m; see
// coords.ts) rather than derived from it, since "how big should a burn look" is a visual
// judgment call, not a physical conversion. Deliberately exaggerated well past the chaser
// marker's own radius (0.3, see ChaserMarker.tsx) -- a same-order-as-the-marker arrow reads as
// "contained inside the sphere" rather than "a distinct visual element", especially since the
// shaft (a thin WebGL line, effectively always ~1px regardless of scene scale) barely reads at
// all next to a much bigger sphere.
const BURN_SCALE = 180;
const MIN_LENGTH = 1.1;
const MAX_LENGTH = 4.5;

/**
 * A 3D arrow from the chaser showing the current burn's direction and (clamped) magnitude --
 * the spatial complement to the effort chart: watch the arrow shrink as a well-tuned gain
 * approaches, instead of just reading a number.
 */
export function BurnArrow() {
  // Same idiom as ChaserMarker/GhostMarker's position refs: this ArrowHelper is mutated every
  // frame in useFrame below (never replaced, no re-render involved), so it belongs in a ref
  // rather than useMemo/useState. BurnArrow takes no props, so the unused-and-discarded
  // ArrowHelper construction on renders after the first never actually happens in practice.
  const arrowRef = useRef(new ArrowHelper(new Vector3(0, 1, 0), new Vector3(0, 0, 0), MIN_LENGTH, BURN_ARROW));
  // R3F's documented <primitive object={...}/> pattern for mounting an imperatively-created
  // three.js object requires reading ref.current during render; there's no JSX-only way to do it.
  const arrow = arrowRef.current; // oxlint-disable-line react/refs
  const stateSample = useRef<number[]>([0, 0, 0, 0, 0, 0]);
  const uSample = useRef<number[]>([0, 0, 0]);
  const dir = useRef(new Vector3());

  useFrame(() => {
    const { current, currentTime } = useRendezvousStore.getState();
    const state = sampleTrajectory(current.trajectory, currentTime, stateSample.current);
    const u = sampleTrajectory({ t: current.trajectory.t, x: current.u }, currentTime, uSample.current);

    const [px, py, pz] = toRenderPosition(state[0], state[1], state[2]);
    arrow.position.set(px, py, pz);

    const mag = Math.hypot(u[0], u[1], u[2]);
    if (mag < 1e-12) {
      arrow.visible = false;
      return;
    }
    arrow.visible = true;
    // toRenderPosition applies a uniform meters->render-unit scale and the same axis
    // permutation for any input, so reusing it here gives the correctly-oriented render-space
    // direction without needing a separate mapping just for vectors.
    const [dx, dy, dz] = toRenderPosition(u[0], u[1], u[2]);
    dir.current.set(dx, dy, dz).normalize();
    const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, mag * BURN_SCALE));
    arrow.setDirection(dir.current);
    // A stubbier, bigger head (vs. ArrowHelper's thin default) so the arrow reads as a bold
    // marker rather than a thin line next to the much larger chaser sphere.
    arrow.setLength(length, length * 0.45, length * 0.3);
  });

  return <primitive object={arrow} />;
}
