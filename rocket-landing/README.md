# Rocket Landing: Nonlinear MPC (iLQR)

An interactive bonus demo for ASE 330M: a planar rocket with genuinely nonlinear dynamics (thrust
direction is coupled to attitude through `sin θ`/`cos θ`, unlike every other demo in this repo,
which is built around a linear or linearized state-space plant) landed by a receding-horizon
nonlinear MPC controller solved with iLQR. Drag the rocket to set up a starting condition -- or
grab it mid-flight as a disturbance -- and watch the controller replan; adjust the cost weights to
see how the tradeoffs change the landing, including making it crash.

The controller discretizes the dynamics with RK4 and linearizes each step's *exact* discrete
Jacobians (propagated analytically through the four RK4 stages, not finite-differenced -- that
would be a real slowdown inside the solver's hot loop). Each replan is a regularized DDP/iLQR
backward pass (Levenberg-Marquardt regularization on both the control-cost Hessian `Quu` and the
propagated value-function curvature `Qxx`) followed by a forward pass with an Armijo backtracking
line search (`c1 = 0.01`). During live playback only a couple of iterations run per tick (cheap,
warm-started from the previous solve's shifted trajectory -- a "real-time iteration" scheme);
setting up an initial condition while paused runs a fuller solve so the predicted-trajectory
preview looks converged.

No course MATLAB script covers this scenario (checked `../../utaustin-ase330m-code/matlab-scripts/`)
-- this is an original demo extending the "Control design" unit's linear state-feedback demos
(`../flight-control`, `../satellite-docking`) into nonlinear/optimal control.

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

- `src/core/` — pure TypeScript physics/solver math, no React dependencies, independently
  unit-tested (`npm run test`):
  - `dynamics/rocket.ts` — the nonlinear equations of motion and their analytic Jacobians.
  - `dynamics/presets.ts` — the three scenario presets.
  - `sim/rk4.ts`, `sim/matrix.ts` — a fixed-step RK4 integrator and small generic matrix helpers
    (multiply, transpose, a Gaussian-elimination linear solve).
  - `mpc/linearize.ts` — propagates the continuous analytic Jacobians through RK4's four stages
    to get the *exact* discrete-step Jacobians.
  - `mpc/cost.ts` — the running and terminal quadratic cost and their gradients/Hessians.
  - `mpc/ilqr.ts` — the regularized backward pass, Armijo forward pass, and the top-level
    receding-horizon `solve()`.
  - `control/rtiSim.ts` — one real-time-iteration tick: re-solve (warm-started), apply the first
    control to the true nonlinear dynamics, burn fuel, check for touchdown.
- `src/store/rocketLandingStore.ts` — a Zustand store wiring the staged initial condition (from
  dragging and the orientation/descent-rate sliders), the cost-weight sliders, and the live
  closed-loop state to the `core/` pipeline, plus history arrays for the charts below.
- `src/viz/` — a plain 2D canvas scene (the rocket, its main plume and RCS burst scaled by the
  applied thrust/torque, the predicted-horizon preview, the flown trail, and pointer-drag-to-
  reposition), a plain-HTML equations/linearization readout (no math-typesetting library
  anywhere in this repo, so this mirrors `satellite-docking`'s `MatrixReadout.tsx`-style
  plain-HTML approach rather than real typeset math), Recharts actuator-effort/fuel/g-force
  panels, and the slider/preset/playback controls.

## Scope

Fuel is bookkeeping only: `dFuel/dt = -T / (Isp · g0)` is integrated for the chart and doesn't
feed back into the rigid-body dynamics (mass and inertia are held constant) -- modeling a
mass-varying plant would roughly double the solver's state-Jacobian bookkeeping for a demo whose
point is the attitude/thrust nonlinearity, not propulsion mass fraction.

Torque is an idealized attitude-control actuator (a gimbal or RCS thruster), decoupled from the
fuel/thrust model -- it's "free" in the sense that using it doesn't burn any of the tracked fuel.

Ground handling is a soft quadratic cost penalty on the *predicted* horizon dipping below the pad,
not a hard constraint -- this repo's solver doesn't implement a constrained (e.g. box-DDP/active-
set) backward pass, so state constraints are handled the same way control saturation is: by
shaping the cost and clamping in the rollout, not by a formal feasibility guarantee.

The landing-safety thresholds (`LANDING_SAFE_VY/VX/THETA/OMEGA` in `core/constants.ts`) are
deliberately generous teaching signals -- "did the controller bring this in gently enough to call
it a landing" -- not a realism target for an actual vehicle's touchdown gear.

A large enough disturbance (dragged far off-axis, or already falling fast and tilted) can be
genuinely unrecoverable given the vehicle's finite thrust and torque authority -- this is expected
behavior, not a bug: the "tumbling in" preset is deliberately a harder recovery that doesn't
always succeed.
