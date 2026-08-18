# Flight Control: Phugoid State Feedback

An interactive lecture-demo tool for ASE 330M's control-design unit: design a linear
state-feedback controller `u = -K·(x - x_ref)` for the longitudinal (phugoid/short-period)
dynamics of the same General Aviation airframe modeled in `../aircraft-explorer`, and watch the
closed-loop poles/zeros, frequency response, tracking error, and 3D aircraft motion respond as
you tune `K`.

`x_ref(t)` unifies two demos in one architecture: setting it to 0 (the "Trim hold" maneuver)
recovers pure disturbance rejection — the direct control-design analogue of the free-response
phugoid in `aircraft-explorer` — while a nonzero `x_ref(t)` (a speed step, a pitch/climb step, or
a sinusoid) turns the same formula into a reference-tracking problem. Because the actual
actuator is a single elevator (`B` is one column), the reference-forcing term `BK` is always a
scalar multiple of `B` — a classical consequence is that state feedback moves the closed-loop
poles but never the transmission zeros, which the pole/zero chart calls out explicitly.

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

- `src/core/` — pure TypeScript, no React dependencies, independently unit-tested (`npm run
  test`):
  - `aero/`, `types/`, `linalg/eig.ts`, `sim/` — the longitudinal small-perturbation state-space
    model, eigendecomposition, and RK4 integrator, vendored from `aircraft-explorer` (each demo
    is an independent app — see the root README).
  - `linalg/zeros.ts` — SISO transmission zeros of `C(sI-A)^-1 B`, computed by sampling the
    numerator polynomial and root-finding via a companion matrix (no generalized-eigenvalue
    solver needed).
  - `control/referenceSignals.ts` — the four maneuvers' `x_ref(t)` builders.
  - `control/closedLoopSim.ts` — simulates `u = -K·(x - x_ref(t))` in closed loop, with an
    adaptive RK4 step size (so aggressive gains don't produce spurious *numerical* instability)
    and a divergence guard that truncates the trajectory instead of propagating NaN/huge values.
  - `control/frequencyResponse.ts` — closed-loop reference-to-output frequency response via a
    real `2n×2n` block linear solve (avoids complex-matrix arithmetic).
- `src/store/controlStore.ts` — a Zustand store wiring `K`, the active maneuver and its
  parameters, and playback state to the `core/` pipeline, recomputing the closed-loop simulation,
  poles/zeros, and frequency response on every change.
- `src/viz/` — React Three Fiber 3D aircraft animation (vendored from `aircraft-explorer`),
  Recharts tracking/pole-zero/frequency-response panels, and gain/maneuver controls.

## Scope

Only the longitudinal axis (phugoid/short-period) is modeled, with a single fixed airframe
(General Aviation). Lateral-directional state feedback (Dutch roll damping) is a planned
follow-up on the same branch once this pass is converged on — see the aircraft-explorer demo for
the lateral dynamics this would extend.
