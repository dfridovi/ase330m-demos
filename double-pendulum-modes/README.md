# Double Pendulum: Normal Modes

An interactive lecture-demo tool for ASE 330M: adjust a double pendulum's masses and rod
lengths and watch its linearized free response decompose into two independent normal modes —
a slow, in-phase swing (both bobs move the same direction) and a fast, anti-phase swing (they
move opposite directions). Presets let you release the pendulum from a "pure" mode 1, a pure
mode 2, or an equal mix of both, so students can see a single clean oscillation collapse into
a beat pattern when mixed.

Companion to `../matlab-scripts/double_pendulum.m` and
`../matlab-scripts/double_pendulum_modal_decomposition.m` — same underlying theory (and the
same fixed-parameter matrix, at `m1=m2=l1=l2=g=1`), but the matrix here is derived from
physical parameters you can actually change instead of hardcoded.

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

- `src/core/` — pure TypeScript physics/math (linearized state-space assembly, eigendecomposition,
  RK4 simulation, modal decomposition, mode-shape helpers). No React dependencies, and
  independently unit-tested (`npm run test`).
- `src/store/` — Zustand store wiring UI state (physical params, initial condition, playback,
  per-mode visibility) to the `core/` pipeline.
- `src/viz/` — 2D canvas pendulum animation (full response + each mode overlaid, matching the
  MATLAB script's black/blue/red overlay), Recharts panels, and slider/control components.

## Scope

Only the free (initial-condition) response is modeled — there's no forced input, matching the
course's MATLAB reference. The physical model is a linearization about the hanging equilibrium
of two point masses on massless rods; it's most accurate for small release angles (roughly
under 30°), which the initial-condition sliders are range-limited to reflect.
