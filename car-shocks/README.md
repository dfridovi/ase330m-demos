# Quarter-Car Forced Response

An interactive lecture-demo tool for ASE 330M: a mechanic rhythmically pushing on a car's hood
to test its shocks, modeled as a 1DOF spring-mass-damper (`m`, `k`, `c`) forced directly on the
body. The headline idea is that the step response, impulse response, and steady-state
frequency response are all different views of the *same* underlying system — they all trace
back to the eigenvalues of the state matrix `A`.

Following the state-space derivation used in class (not the damping-ratio/natural-frequency
route): writing the equation of motion `m·ẍ + c·ẋ + k·x = f(t)` in first-order form
`ż = Az + Bf(t)` gives eigenvalues `σ ± iω_d`, where `σ = -c/(2m)` (decay rate) and
`ω_d = √(k/m - σ²)` (damped oscillation frequency). Every response shown — the free bounce, the
step and impulse responses, and the steady-state amplitude/phase to periodic forcing — is
expressed in terms of `σ` and `ω_d` only.

Companion to the course's `../matlab-scripts/frequency_response_plane_turning.m` and
`frequency_response_questions.m` in spirit (same forced-response / frequency-response method),
though this demo originates its own car-shocks framing rather than porting a specific script —
no existing course script covers this exact scenario.

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

- `src/core/` — pure TypeScript physics/math: the state-space model and eigenvalues
  (`dynamics/quarterCar.ts`), closed-form step (`dynamics/stepResponse.ts`) and impulse
  (`dynamics/impulseResponse.ts`) responses, the steady-state frequency response
  (`dynamics/frequencyResponse.ts`), presets (`dynamics/presets.ts`), and a numeric RK4
  integrator (`sim/rk4.ts`) driving the periodic-forcing simulation (`sim/simulate.ts`). No
  React dependencies, and independently unit-tested (`npm run test`) — including finite-difference
  checks that each closed form actually satisfies the ODE, and a check that the numerically
  integrated periodic response converges to the closed-form steady-state amplitude/phase once
  the transient decays.
- `src/store/` — a Zustand store wiring UI state (`m, k, c, ω, f0, I`, the active response tab,
  and playback) to the `core/` pipeline.
- `src/viz/` — a plain 2D canvas animation of the car body bouncing on its spring/damper (no
  React Three Fiber — this is a single vertical DOF, unlike the other 3D demos), Recharts
  time- and frequency-domain panels, and slider/preset/playback controls.

## Scope

Only a direct force applied to the car body is modeled (the mechanic pushing the hood) — not a
base/road excitation transmitted through the shocks into the body, which would use a different
transfer function (transmissibility rather than receptance). The periodic-forcing tab
numerically integrates `ż = Az + BF(t)` via RK4 from rest, so the transient build-up into steady
state is visible; the step and impulse tabs use the closed-form underdamped solutions directly.
The damping slider is capped so every reachable `(m, k, c)` combination stays underdamped —
the closed forms here assume complex eigenvalues, matching what's taught in class.
