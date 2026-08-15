import { noDriftVy0 } from './cw';
import type { RelativeState } from '../types/orbit';

export interface Preset {
  id: string;
  label: string;
  description: string;
  // Presets are defined relative to the current mean motion n, since the "no drift"
  // condition (vy0 = -2n x0) depends on it.
  build: (n: number) => RelativeState;
}

export const PRESETS: Preset[] = [
  {
    id: 'drift',
    label: 'Generic drift',
    description:
      "A 1 km in-track offset released from rest. vy0 ≠ -2n·x0, so the relative " +
      'orbit drifts steadily along-track instead of closing on itself — and keeps drifting ' +
      'forever. That growth is a genuine instability, not just an unlucky initial condition ' +
      "(see the mode table) — watch it fly off in the 3D view.",
    build: () => ({ x: 1000, y: 1000, z: 0, vx: 0, vy: 0, vz: 0 }),
  },
  {
    id: 'closed-ellipse',
    label: 'Closed periodic ellipse',
    description:
      'Same 1 km radial offset, but vy0 is set to exactly -2n·x0 — the classic ' +
      'drift-free condition. The relative orbit is now a closed 2:1 ellipse that repeats ' +
      'every orbit.',
    build: (n) => ({ x: 1000, y: 0, z: 0, vx: 0, vy: noDriftVy0(1000, n), vz: 0 }),
  },
  {
    id: 'tilted-3d',
    label: 'Cross-track excited (tilted 3D orbit)',
    description:
      'The closed in-plane ellipse plus an out-of-plane oscillation at the same ' +
      'frequency n, 90° out of phase. Because both run at exactly the same frequency, ' +
      'the result is a tilted, closed 3D relative orbit — the shape used for passive ' +
      'safety ellipses in rendezvous.',
    build: (n) => ({
      x: 1000,
      y: 0,
      z: 0,
      vx: 0,
      vy: noDriftVy0(1000, n),
      vz: 500 * n,
    }),
  },
];
