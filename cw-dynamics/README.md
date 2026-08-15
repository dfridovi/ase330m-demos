# Clohessy-Wiltshire: Relative Orbital Motion

An interactive lecture-demo tool for ASE 330M: set a chief satellite's circular-orbit altitude
and a chaser's initial relative position/velocity, and watch the chaser's linearized motion
relative to the chief. The headline phenomenon is the along-track **drift condition**: unless
`vy0` exactly cancels `-2n·x0`, the relative orbit doesn't close on itself — it drifts steadily
along-track, orbit after orbit, instead of tracing a repeating ellipse.

This is also a nice structural contrast with the flight dynamics and double pendulum demos. The
aircraft demo's short-period/phugoid (longitudinal) and dutch-roll/roll-subsidence/spiral (lateral) modes,
and the double-pendulum's slow in-phase and fast anti-phase swings, are all genuinely distinct
oscillatory or exponential modes at different frequencies. There's no such split here: the
in-plane subsystem's zero eigenvalue is a **repeated root** captured by a single 2x2 Jordan block
rather than two independent eigenvectors. In `exp(At)`, that block contributes a term
`t*exp(λt)`, which for `λ=0` is just `t` — the secular drift — instead of a second oscillation.
The two genuinely oscillatory pieces that remain (the bounded in-plane ellipse, and the fully
decoupled cross-track motion) both run at the *same* frequency `n`, the chief's mean motion.

This repeated root also makes the system *unstable* and not only non-periodic: every
eigenvalue of the linearized `A` has zero real part (none in the right half-plane), so a check of
eigenvalue locations alone would call it stable. It isn't — the Jordan block means the
along-track state grows linearly and without bound for almost any initial condition. Eigenvalue
location alone doesn't determine stability; diagonalizability does too.

Companion to `../matlab-scripts/clohessy_wiltshire.m` and
`../matlab-scripts/clohessy_wiltshire_modal_decomposition.m` — same underlying theory, but
altitude and initial condition are adjustable sliders instead of hardcoded, and the response is
evaluated from the exact closed-form CW solution rather than numerical integration (see Scope).

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

- `src/core/` — pure TypeScript physics/math: mean motion and the closed-form CW state
  transition (`dynamics/cw.ts`), presets (`dynamics/presets.ts`), and time-series generation
  (`sim/simulate.ts`). No React dependencies, and independently unit-tested (`npm run test`) —
  including a direct check that the closed form satisfies the CW ODEs via numerical
  differentiation, not just an algebraic match to the formulas.
- `src/store/` — a Zustand store wiring UI state (chief altitude, initial condition, playback,
  view mode, per-mode visibility) to the `core/` pipeline.
- `src/viz/` — a 2D canvas view of the radial/along-track (LVLH) plane matching the MATLAB
  script's `animatedline` plot, a React Three Fiber 3D view including the cross-track axis,
  Recharts time-domain panels, and slider/preset/playback controls.

## Scope

Only the free (initial-condition) response of a chaser about a **circular** chief orbit is
modeled — no eccentricity, and no forced input/control design (that's the follow-on controls
course; see `../matlab-scripts/clohessy_wiltshire_inputs.m` for the course's rendezvous-control
example, which this demo intentionally does not cover).

The response is computed from the exact closed-form Clohessy-Wiltshire state transition matrix
rather than by numerically integrating `xdot = Ax` and eigendecomposing `A` (the pipeline the
other two demos use). That's a deliberate choice, not just an optimization: the in-plane
subsystem's zero eigenvalue is a repeated root with only one independent eigenvector, so a naive
eigendecomposition doesn't cleanly separate into independent modal coordinates the way it does
for the aircraft/pendulum systems. The
closed form sidesteps that entirely and is exact at any `t`, not just numerically stable near it.
