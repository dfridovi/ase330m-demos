// Two reference gains, computed offline (same spirit as clohessy_wiltshire_inputs.m's
// K_team/K_elon, not a live in-browser pole-placement solver -- see the demo README's Scope
// section) for the effort-comparison chart's "team vs. Elon" contrast: a naive design and a
// deliberately better one, both stabilizing, from the same initial condition.
export interface GainPreset {
  id: string;
  label: string;
  description: string;
  build: (n: number) => number[][];
}

// The "naive" design: plain diagonal position+rate feedback per translational axis, exactly
// mirroring the matlab script's K_team. It ignores the Coriolis-like coupling terms in the CW
// A matrix entirely (the 2n*vy / -2n*vx cross-terms, the 3n^2 radial anti-restoring term) --
// it stabilizes the system (the coupling is weak relative to these gains) but wastes control
// effort fighting terms a smarter design would just cancel.
function naiveK(kp: number, kd: number): number[][] {
  return [
    [kp, 0, 0, kd, 0, 0],
    [0, kp, 0, 0, kd, 0],
    [0, 0, kp, 0, 0, kd],
  ];
}

// The "tuned" design: choose u to *cancel* the coupling terms in the open-loop dynamics first
// (feedback linearization), then add independent critically-damped PD per axis on top. Since
//   vxdot = 3n^2 x + 2n vy + ux,  vydot = -2n vx + uy,  vzdot = -n^2 z + uz,
// picking
//   ux = -3n^2 x - 2n vy - kp x - kd vx,  uy = 2n vx - kp y - kd vy,  uz = n^2 z - kp z - kd vz
// leaves three fully decoupled, independent 2nd-order systems x''+kd x'+kp x = 0 (and same for
// y, z) with natural frequency sqrt(kp) and damping kd/(2 sqrt(kp)) -- exactly the "Elon" style
// pole-placed design, just derived by hand instead of via a generic MIMO place() call. Verified
// against eig(A - B*K): all six closed-loop poles land exactly at -zeta*wn (a real, repeated,
// critically-damped root), for both the full 6-state system and its in-plane 2x4 block.
function tunedK(n: number, wn: number, zeta: number): number[][] {
  const kp = wn * wn;
  const kd = 2 * zeta * wn;
  return [
    [3 * n * n + kp, 0, 0, kd, 2 * n, 0],
    [0, kp, 0, -2 * n, kd, 0],
    [0, 0, kp - n * n, 0, 0, kd],
  ];
}

// wn chosen so the default trailing-1km preset closes to within the capture threshold in well
// under the default simulation window, at a control effort meaningfully below the naive design's
// (see tests/core/gainPresets.test.ts) -- critically damped (zeta=1) so it approaches without
// overshoot.
const TUNED_WN = 0.003; // rad/s
const TUNED_ZETA = 1.0;

// Deliberately weaker/less efficient than the tuned design while still comfortably stabilizing
// and still capturing well inside the default window -- see gainPresets.test.ts for the
// effort-ratio regression guard this depends on.
const NAIVE_KP = 3e-5;
const NAIVE_KD = 0.015;

export const GAIN_PRESETS: GainPreset[] = [
  {
    id: 'naive',
    label: 'Naive gain',
    description:
      "Plain position+rate feedback on each axis, ignoring the CW equations' Coriolis-like " +
      "coupling entirely. It stabilizes and gets the job done, but it's fighting terms a " +
      'smarter design would just cancel -- watch the effort chart.',
    build: () => naiveK(NAIVE_KP, NAIVE_KD),
  },
  {
    id: 'tuned',
    label: 'Tuned gain',
    description:
      'Cancels the coupling terms first, then applies independent critically-damped feedback ' +
      'per axis -- three decoupled second-order responses instead of one fighting the coupling. ' +
      'Same job, noticeably less control effort.',
    build: (n) => tunedK(n, TUNED_WN, TUNED_ZETA),
  },
];
