// Physical parameters for the planar lander. Chosen to be a plausible small descent stage
// (order-of-magnitude consistent with Isp/T/W ratios for a hypergolic RCS + main engine), not a
// real vehicle -- tuned for a demo that's fun to fly, not for accuracy.
export const G = 9.81; // m/s^2
export const MASS = 1200; // kg, held constant -- see README Scope (fuel is bookkeeping only)
export const LENGTH = 8; // m, used for the moment-of-inertia estimate and the canvas sprite
export const INERTIA = (MASS * LENGTH * LENGTH) / 12; // kg*m^2, slender-rod approximation

export const T_MAX = 20000; // N, ~1.7x weight so hover + margin is achievable
export const TAU_MAX = 9000; // N*m

// Main-engine specific impulse, used only for the fuel-remaining bookkeeping (dFuel/dt =
// -FUEL_RATE_PER_THRUST * T) -- decoupled from the rigid-body dynamics above.
const ISP = 250; // s
export const FUEL_RATE_PER_THRUST = 1 / (ISP * G); // kg of fuel per (N*s) of thrust
// A clean landing burns ~25kg (measured from the scenario presets) -- 40kg gives a visibly
// draining gauge and a real (if generous) margin, rather than the ~6% dip 400kg produced.
export const DEFAULT_FUEL = 40; // kg

export const PAD_X = 0;
export const PAD_Y = 0;

export const DT = 0.05; // s, MPC discretization step
export const HORIZON_STEPS = 50; // N, 2.5s lookahead

// Fixed (non-slider) cost-shaping weight for the soft ground penalty w_ground * max(0, -py)^2 --
// internal to the solver, not a student-facing knob.
export const GROUND_PENALTY_WEIGHT = 2000;

// Fixed (non-slider) cost-shaping constants that ramp the attitude weight up near the pad (see
// mpc/cost.ts's thetaApproachMultiplier) -- lets touchdown attitude be tightly regulated without
// needing a globally huge q_theta slider value that would fight the position weight everywhere.
export const THETA_APPROACH_HEIGHT = 25; // m
export const THETA_APPROACH_BOOST = 2500; // effective q_theta multiplier at py=0 is (1 + this)

// Touchdown is "landed" if all these are satisfied when py first reaches PAD_Y; otherwise
// "crashed". Deliberately generous -- this is a teaching signal, not a realism target.
export const LANDING_SAFE_VY = 2; // m/s
export const LANDING_SAFE_VX = 1.5; // m/s
export const LANDING_SAFE_THETA = 0.1; // rad (~5.7 deg)
export const LANDING_SAFE_OMEGA = 0.3; // rad/s

export interface CostWeights {
  qPos: number;
  qTheta: number;
  qVel: number;
  qOmega: number;
  rThrust: number;
  rTorque: number;
  terminalScale: number;
}

// qPos and terminalScale are both set well above what might look "natural" -- a weak position
// weight leaves a stable non-zero hover altitude as a cheaper closed-loop equilibrium than
// actually touching down (the running position cost near the pad is too small to outweigh the
// (tiny) transient thrust cost of committing to the last meter of descent), so the receding-
// horizon controller happily parks a meter or two above the pad forever instead of landing.
// Confirmed empirically while building this demo: qPos=1/terminalScale=30 reproduces the parking
// bug, qPos=10/terminalScale=45 reliably lands from a mild offset within the tests' tick budgets.
export const DEFAULT_WEIGHTS: CostWeights = {
  qPos: 10,
  qTheta: 20,
  qVel: 2,
  qOmega: 5,
  rThrust: 2e-5,
  rTorque: 2e-4,
  terminalScale: 45,
};

export const WEIGHT_SLIDER_RANGES = {
  qPos: { min: 0, max: 30, step: 0.5 },
  qTheta: { min: 0, max: 100, step: 1 },
  qVel: { min: 0, max: 10, step: 0.1 },
  qOmega: { min: 0, max: 30, step: 0.5 },
  rThrust: { min: 0, max: 2e-4, step: 1e-6 },
  rTorque: { min: 0, max: 2e-3, step: 1e-5 },
  terminalScale: { min: 1, max: 100, step: 1 },
};

export const IC_SLIDER_RANGES = {
  theta0: { min: -0.6, max: 0.6, step: 0.01 },
  vy0: { min: -20, max: 0, step: 0.5 },
};

// Canvas drag range for the initial/live position, in meters -- also what the canvas transform
// uses to size the view (see RocketCanvas.tsx's computeTransform), so this doubles as the
// camera's field of view. Sized to the actual flight envelope (scenario presets top out around
// py0=50, px0=+-15) rather than a much wider range, so the rocket reads as more than a speck.
export const DRAG_BOUNDS = {
  pxMin: -35,
  pxMax: 35,
  pyMin: 0,
  pyMax: 70,
};
