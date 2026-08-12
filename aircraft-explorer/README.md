# Aircraft Dynamics Explorer

An interactive lecture-demo tool for ASE 330M: adjust an aircraft's physical parameters
(mass, inertia, wing geometry, CG location, altitude, airspeed) and watch them propagate
through standard flight-dynamics dimensionalization formulas into a small-perturbation
state-space model (`A`/`B`/`C`/`D`), then see the resulting motion as a 3D animation,
time-series plots, and a modal decomposition. Covers both axes of motion, toggled from the
header: **longitudinal** (pitch/climb: short period and phugoid modes) and
**lateral-directional** (roll/yaw: roll subsidence, dutch roll, and spiral modes).

Companion to the fixed-matrix examples in `../matlab-scripts/aircraft_dynamics_modes.m` —
same underlying theory, but the matrices are now derived from physical parameters you can
actually change, instead of hardcoded.

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

- `src/core/` — pure TypeScript physics/math (aerodynamic derivatives, state-space assembly,
  eigendecomposition, RK4 simulation, modal decomposition). No React or Three.js
  dependencies, and independently unit-tested (`npm run test`).
- `src/store/` — Zustand store wiring UI state to the `core/` pipeline.
- `src/viz/` — React Three Fiber 3D scene, Recharts panels, and slider/control components.

## Scope

Both longitudinal and lateral-directional dynamics are covered, driven by the same physical
parameters (mass, inertia, geometry, altitude, airspeed — the lateral axis additionally uses
roll/yaw inertia `Ixx`/`Izz`/`Ixz`). Control-law design (LQR/pole placement) is intentionally
out of scope — that's the follow-on controls course. The lateral axis doesn't yet have a
forced-response (aileron/rudder doublet) input mode; only free (initial-condition) response.
