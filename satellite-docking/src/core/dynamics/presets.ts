import type { RelativeState } from '../types/relativeState';

export interface Preset {
  id: string;
  label: string;
  description: string;
  build: () => RelativeState;
}

export const INITIAL_CONDITION_PRESETS: Preset[] = [
  {
    id: 'trailing',
    label: 'Trailing (V-bar)',
    description:
      'Chaser released 1 km behind the chief, same orbit, at rest relative to it (no closing ' +
      "velocity). This is the exercise's default scenario: design K to close that gap to a few " +
      'meters without overshooting into an unstable drift. Open loop here is exactly ' +
      'stationary, not just slow -- two satellites in the same circular orbit, differing only ' +
      'in phase, maintain a constant along-track separation forever (the CW secular drift rate ' +
      'is -3(2n x0 + vy0), which is exactly zero when x0 = vy0 = 0). The open-loop ghost will ' +
      'sit frozen in place; that is the correct physics, not a stall.',
    build: () => ({ x: 0, y: -1000, z: 0, vx: 0, vy: 0, vz: 0 }),
  },
  {
    id: 'radial-offset',
    label: 'Radial offset',
    description:
      '500 m above the chief (radial), at rest. Open-loop this drifts steadily along-track ' +
      '(see the free-response cw-dynamics demo) -- here, K has to fight that drift as well as ' +
      'close the gap.',
    build: () => ({ x: 500, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }),
  },
];
