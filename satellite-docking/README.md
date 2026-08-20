# Satellite Rendezvous: CW State Feedback

An interactive lecture-demo tool for ASE 330M's control-design unit: design a linear
state-feedback controller `u = -K·x` for the same Clohessy-Wiltshire relative-motion equations
modeled (open-loop only) in `../cw-dynamics`, and try to drive a chaser satellite trailing 1 km
behind the chief to within a few meters of it -- without diverging.

Students start in an **in-plane** stage (2 thrusters, radial + along-track only, 4 states) and
move to a **full 3D** stage (a 3rd thruster brings cross-track online, 6 states) once the in-plane
case is under control. A built-in effort comparison against two hardcoded reference gains -- a
naive diagonal position/rate design and a "tuned" one that cancels the equations' Coriolis-like
coupling before adding damping -- recreates the course's `clohessy_wiltshire_inputs.m` script:
both gains stabilize the system, but one does it for a fraction of the control effort. Getting a
chaser to stop drifting is necessary but not sufficient; doing it efficiently is the actual design
problem.

Companion to `../cw-dynamics` (same physical model, this demo adds the control input `cw-dynamics`
explicitly scopes out) and `../flight-control` (same `u = -K·(x - x_ref)` architecture, here
`x_ref = 0` throughout since this is a regulation/rendezvous problem, not a tracking one -- see
Scope).

## Running it

```bash
npm install

# Iterating on code (hot reload, but noticeably slower — don't judge performance here)
npm run dev

# What to actually use for a live demo — much smoother
npm run build
npm run preview
```

## Layout

- `src/core/` — pure TypeScript physics/control math, no React dependencies, independently
  unit-tested (`npm run test`):
  - `dynamics/cw.ts` — mean motion and the CW state matrix, vendored from `cw-dynamics` (same
    formulas), plus the fixed translational-thruster input matrix from the course's
    `clohessy_wiltshire_inputs.m` (unit chaser mass, `u` in m/s²).
  - `dynamics/presets.ts` — initial-condition presets, default the trailing-1km scenario.
  - `sim/rk4.ts`, `linalg/eig.ts` — vendored from `flight-control` (both already generic over
    state dimension, so no changes needed for the 6-state MIMO plant here).
  - `control/closedLoopSim.ts` — a MIMO generalization of `flight-control`'s closed-loop
    simulator (`K`/`B` matrices, `u` vector-valued instead of scalar), plus `cumulativeEffort`,
    the trapezoidal `∫ uᵀu dt` the effort-comparison chart plots.
  - `control/gainPresets.ts` — the two hardcoded reference gains (naive and tuned), computed
    offline the same way the matlab script's `K_team`/`K_elon` were, not via a live in-browser
    pole-placement solver — see that file's design comment for the coupling-cancellation math
    behind the "tuned" gain.
  - `control/metrics.ts` — distance-to-target and sustained-capture-time helpers.
- `src/store/rendezvousStore.ts` — a Zustand store wiring stage (in-plane/full), initial
  condition, and `K` to the `core/` pipeline, recomputing the student's closed-loop simulation
  *and* both reference gains' simulations (from the same initial condition) on every change.
- `src/viz/` — a 2D canvas view of the radial/along-track plane (adapted from `cw-dynamics`),
  a React Three Fiber 3D view including a capture-radius sphere, Recharts distance/effort/
  state-time-history panels, and gain/initial-condition/stage controls.

## Scope

Translational thrust only, unit chaser mass (`u` is specific force in m/s², not an actual
thruster/mass/fuel model) — same simplification the course's matlab script makes. The two
reference gains are precomputed by hand, not from a general MIMO pole-placement routine; a
from-scratch place()-equivalent for a 3-input/6-state system is a meaningfully larger undertaking
than this demo needs; both gains are verified stabilizing (and the tuned one verified more
efficient) in `tests/core/gainPresets.test.ts`.

Only a circular chief orbit is modeled (same as `cw-dynamics`), and the reference the controller
regulates to is always the fixed LVLH origin — there's no time-varying reference-tracking mode
the way `flight-control`'s maneuvers work, since "meet the chief" is inherently a fixed-point
regulation problem, not a tracking one.
