import type { AirframePreset } from '../types/aircraft.ts';

// Coefficients tuned so that, at the default physical parameters below, the resulting
// short-period/phugoid eigenvalues land close to the longitudinal example already used in
// lecture (matlab_scripts/aircraft_dynamics_modes.m): short period wn~3.6 rad/s, zeta~0.69;
// phugoid wn~0.21 rad/s, zeta~0.08. These are illustrative, representative-order-of-magnitude
// values for a light GA aircraft, not a specific certified aircraft's published data.
export const GENERAL_AVIATION: AirframePreset = {
  id: 'general-aviation',
  name: 'General Aviation',
  description: 'Light single-engine aircraft, e.g. a Cessna/Navion-class trainer. The baseline case.',
  whatToLookFor:
    'Watch the modal decomposition chart (defaulted to theta): the Short Period (dashed) dies out in under 2 ' +
    'seconds, while the Phugoid (dotted) keeps trading speed for altitude in a slow, barely-damped oscillation ' +
    'for the full 60s run. These are the two classic longitudinal modes — a fast, heavily-damped one and a ' +
    'slow, lightly-damped one. Switch the dropdown to alpha and the Phugoid nearly vanishes — that\'s not a ' +
    'bug, it\'s the classic "constant angle of attack" phugoid approximation: the mode barely touches alpha.',
  coefficients: {
    CL0: 0.41,
    CLalpha: 4.4,
    CD0: 0.05,
    CDalpha: 0.33,
    Cmalpha: -0.28,
    Cmalphadot: -1.8,
    Cmq: -4.5,
    CLdeltae: 0.35,
    Cmdeltae: -0.92,
  },
  defaultParams: {
    mass: 1200,
    Iyy: 1300,
    Ixx: 1000,
    Izz: 2000,
    Ixz: 100,
    wingArea: 17.0,
    meanChord: 1.7,
    trimSpeed: 53.6,
    altitude: 0,
    cgShiftFraction: 0,
  },
  defaultX0: [2, 0.03, 0, 0],
  // Phugoid period here is ~29s (wn~0.21 rad/s), so 60s comfortably shows ~2 full cycles.
  tSpan: [0, 60],
  // Verified via modal decomposition: phugoid/short-period peak ratio in theta is ~2.1 (both
  // modes clearly visible), vs. ~0.07 in alpha (phugoid nearly invisible next to the
  // short-period spike) and ~46 in du (short period nearly invisible there instead).
  defaultChartStateIndex: 3,
  // Illustrative lateral-directional coefficients, tuned so the assembled eigenvalues land
  // close to the course's own MATLAB reference (matlab-scripts/aircraft_dynamics_modes.m,
  // "Lateral" section, GA matrix): Dutch Roll wn~2.4 rad/s zeta~0.20 (target 2.38/0.204,
  // matched), Spiral tau~97s stable (target ~112s stable, same order of magnitude and sign),
  // Roll Subsidence tau~0.12s (target 0.119s, matched almost exactly).
  lateral: {
    coefficients: {
      CYbeta: -0.55,
      CYp: 0,
      CYr: 0,
      CYdeltaa: 0,
      CYdeltar: 0.15,
      Clbeta: -0.05,
      Clp: -0.3,
      Clr: 0.07,
      Cldeltaa: 0.17,
      Cldeltar: 0.01,
      Cnbeta: 0.03,
      Cnp: -0.03,
      Cnr: -0.055,
      Cndeltaa: -0.01,
      Cndeltar: -0.08,
    },
    // Matches the MATLAB reference's own x0 = [0,0,0,0.1] (bank-angle-only perturbation).
    defaultX0: [0, 0, 0, 0.1],
    // Spiral time constant ~97s; 200s shows a clearly visible ~2-time-constant decay.
    tSpan: [0, 200],
    // Verified via modal decomposition: Dutch Roll's peak amplitude in p is ~2.5x Roll
    // Subsidence's and Spiral's (all three land on a comparable scale), vs. phi — the MATLAB
    // reference's own plotted variable — where Spiral's cumulative drift is ~18x everything
    // else, burying Dutch Roll to a barely-visible flat line. p is where all three are
    // simultaneously legible; phi is where the overall "growth vs. decay" story reads best
    // (see FullResponseCharts) but is a poor choice for this specific breakdown chart.
    defaultChartStateIndex: 1,
    whatToLookFor:
      'Watch p (roll rate) in the modal decomposition: Roll Subsidence (dashed) kills the initial bank-rate ' +
      'transient in a couple tenths of a second, Dutch Roll (dash-dot) rings for a few cycles over the next ' +
      'several seconds, and Spiral (dotted) is the slow one — a gentle decay over the better part of a ' +
      'minute, most visible as bank angle (phi) in the full-response charts above. All three are stable ' +
      'here, unlike the Fighter preset\'s spiral.',
  },
  visualStyle: {
    wingSweepDeg: 2,
    wingTaperRatio: 0.65,
    tailSweepDeg: 8,
    tailTaperRatio: 0.7,
    finSweepDeg: 25,
    finTaperRatio: 0.6,
    fuselageColor: '#e7e2d2',
    wingColor: '#3987e5',
    tailColor: '#b8b6ac',
  },
};

// Illustrative fighter-class aircraft: heavier, faster, and less statically stable than the
// GA preset, producing a lightly-damped short period and a slower phugoid than the GA case.
export const FIGHTER: AirframePreset = {
  id: 'fighter',
  name: 'Fighter',
  description: 'Supersonic fighter-class aircraft in subsonic cruise. Contrast with General Aviation.',
  whatToLookFor:
    'Compare the Short Period to General Aviation\'s: here it visibly overshoots and rings for a couple of ' +
    'cycles instead of dying out in one — lower damping ratio, same idea. The Phugoid is also much slower ' +
    '(period ~103s vs. GA\'s ~29s), which is why this run plays over 210s instead of 60s — watch theta ' +
    'complete two full, clearly visible cycles. Note: alpha and q barely move during the Phugoid here (its ' +
    'peak amplitude there is under 1% of the Short Period\'s) — that\'s real, not a display bug, so the chart ' +
    'defaults to theta instead, where the Phugoid is exactly as large as the Short Period.',
  coefficients: {
    CL0: 0.15,
    CLalpha: 3.5,
    CD0: 0.02,
    CDalpha: 0.15,
    Cmalpha: -0.3,
    Cmalphadot: -1.0,
    Cmq: -3.0,
    CLdeltae: 0.28,
    Cmdeltae: -0.75,
  },
  defaultParams: {
    mass: 9300,
    Iyy: 75000,
    Ixx: 12000,
    Izz: 90000,
    Ixz: 1500,
    wingArea: 27.87,
    meanChord: 3.45,
    trimSpeed: 200,
    altitude: 3000,
    cgShiftFraction: 0,
  },
  // Altitude excursion for a given [du, alpha] perturbation scales with trim speed (the
  // phugoid's speed/altitude exchange, and the alpha->climb-rate coupling, both carry a
  // factor of U0). At ~4x GA's trim speed, reusing GA's default perturbation produces a ~4x
  // larger altitude swing; scaling this one down by the same U0 ratio (53.6/200) reproduces
  // GA's ~18m excursion instead of a ~70m one.
  defaultX0: [0.5, 0.008, 0, 0],
  // Phugoid period here is ~103s (wn~0.061 rad/s) — much slower than GA's ~29s, so the 60s
  // window used for GA would only show a partial swing. 210s shows ~2 full cycles instead.
  tSpan: [0, 210],
  // Verified via modal decomposition: phugoid/short-period peak ratio in theta is ~1.0 (both
  // modes exactly comparable), vs. ~0.005 in alpha and ~0.03 in q (phugoid essentially
  // invisible in either — it's a near-textbook-pure "constant angle of attack" phugoid here).
  defaultChartStateIndex: 3,
  // Illustrative lateral-directional coefficients, tuned to match the course's own MATLAB
  // reference (aircraft_dynamics_modes.m "Lateral" section, X-29A matrix) qualitatively: weak
  // weathercock stability (Cnbeta ~0.028, low) combined with roll-due-to-yaw-rate (Clr=0.15)
  // flips the classical spiral-mode sign check (L'beta*N'r - L'r*N'beta) negative, producing a
  // genuinely UNSTABLE spiral (tau~-128s) — same sign as the X-29A reference (tau~-31s) —
  // while Dutch Roll stays stable/oscillatory (wn~1.19, zeta~0.07; target 1.32/0.19) and Roll
  // Subsidence is fast (tau~0.57s; target 0.62s, close match). This is the fighter-class
  // "relaxed lateral stability" story, mirroring the longitudinal aft-CG instability.
  lateral: {
    coefficients: {
      CYbeta: -0.35,
      CYp: 0,
      CYr: 0,
      CYdeltaa: 0,
      CYdeltar: 0.1,
      Clbeta: -0.015,
      Clp: -0.24,
      Clr: 0.15,
      Cldeltaa: 0.1,
      Cldeltar: 0.005,
      Cnbeta: 0.028,
      Cnp: -0.02,
      Cnr: -0.196,
      Cndeltaa: -0.005,
      Cndeltar: -0.06,
    },
    defaultX0: [0, 0, 0, 0.1],
    // Spiral time constant ~128s (unstable); 250s shows ~7x growth, a clearly visible
    // divergence without becoming absurd.
    tSpan: [0, 250],
    // Same reasoning as GENERAL_AVIATION.lateral: p shows Roll Subsidence, Dutch Roll, and
    // Spiral at comparable scale (peak ratios all within ~1.5x of each other), while phi is
    // dominated by the Spiral's cumulative drift (~80x everything else there).
    defaultChartStateIndex: 1,
    whatToLookFor:
      'Watch p (roll rate) in the modal decomposition: unlike General Aviation, the Spiral (dotted) grows ' +
      'instead of decaying — this fighter is laterally relaxed-stability, the roll analogue of the ' +
      'longitudinal Aft-CG preset. Roll Subsidence (dashed) and Dutch Roll (dash-dot) are both still ' +
      'stable; only the Spiral diverges, slowly, over the better part of this run — most visible as bank ' +
      'angle (phi) in the full-response charts above.',
  },
  visualStyle: {
    wingSweepDeg: 35,
    wingTaperRatio: 0.3,
    tailSweepDeg: 40,
    tailTaperRatio: 0.35,
    finSweepDeg: 45,
    finTaperRatio: 0.3,
    fuselageColor: '#5a5d63',
    wingColor: '#3987e5',
    tailColor: '#43464b',
  },
};

// Same airframe as GENERAL_AVIATION, CG shifted aft past the neutral point (where
// effectiveCmalpha crosses 0, around cgShiftFraction~=0.064 for these coefficients) so the
// short-period pair collapses into two real roots, one of which is positive: a divergent
// pitch mode instead of a damped oscillation. Verified numerically (see derivatives.ts /
// stateSpace.ts): at 6.5% aft, growth rate ~=0.03/s, so a small initial alpha perturbation
// grows ~6x over the 60s playback window — visibly unstable without blowing up the charts.
// This is the "aft CG -> loses static stability" story from the internal-stability lecture,
// directly demonstrable via the CG slider, but shipped as a one-click preset for the demo.
export const GENERAL_AVIATION_AFT_CG: AirframePreset = {
  id: 'general-aviation-aft-cg',
  name: 'GA — Aft CG (Pitch Unstable)',
  description: 'Same aircraft as General Aviation, but the CG has moved aft of the neutral point.',
  whatToLookFor:
    'Watch alpha and theta grow instead of decay — this airplane is statically unstable. Check the CG shift ' +
    'slider (in the CG position panel) and the Cm_alpha readout next to it: it\'s now positive, meaning a ' +
    'nose-up disturbance creates more nose-up moment instead of restoring itself. Try dragging the CG slider ' +
    'forward to watch the growth slow down, stop, then reverse into the normal damped oscillation.',
  coefficients: GENERAL_AVIATION.coefficients,
  defaultParams: { ...GENERAL_AVIATION.defaultParams, cgShiftFraction: 0.065 },
  defaultX0: [0, 0.02, 0, 0],
  tSpan: GENERAL_AVIATION.tSpan,
  defaultChartStateIndex: 3,
  // CG shift only affects the longitudinal Cm_alpha term in this model (see derivatives.ts) —
  // lateral-directional derivatives are unaffected, so the lateral data is identical to GA's
  // except for an explanatory note (the preset is named "Pitch Unstable" precisely because
  // this axis, unlike longitudinal, shows no instability at all here — worth calling out
  // explicitly rather than silently looking like a stable, unlabeled duplicate of GA).
  lateral: {
    ...GENERAL_AVIATION.lateral,
    whatToLookFor:
      'This preset is only unstable in the Longitudinal axis — CG position doesn\'t enter the ' +
      'lateral-directional equations in this model, so every mode here is identical to plain General ' +
      'Aviation\'s (all stable). ' + GENERAL_AVIATION.lateral.whatToLookFor,
  },
  visualStyle: GENERAL_AVIATION.visualStyle,
};

// Same airframe as FIGHTER, cruising near the top of the troposphere instead of at 3000m.
// Dynamic pressure Q = 1/2 * rho * U0^2 sets the magnitude of every aero stiffness/damping
// term (see derivatives.ts): thinner air at altitude shrinks Q, which shrinks both the
// short-period and phugoid natural frequencies *and* their damping ratios. Verified
// numerically: short-period wn drops from ~2.75 to ~1.70 rad/s (zeta 0.32 -> 0.21) and
// phugoid wn drops from ~0.061 to ~0.039 rad/s (zeta 0.083 -> 0.051) — both oscillations
// visibly slow down and ring for longer before decaying, compared to the Fighter baseline.
export const FIGHTER_HIGH_ALTITUDE: AirframePreset = {
  id: 'fighter-high-altitude',
  name: 'Fighter — High Altitude',
  description: 'Same fighter, cruising near the top of the troposphere (11000m) instead of 3000m.',
  whatToLookFor:
    'Compare to the Fighter baseline (both shown in theta, where the Phugoid is actually visible — see that ' +
    'preset\'s note on alpha/q): both modes are visibly slower (lower natural frequency) and ring for longer ' +
    'before decaying (lower damping ratio). Thinner air lowers dynamic pressure Q = 1/2 rho U0^2, which ' +
    'scales every aero stiffness and damping term at once — try the altitude slider to see the effect ' +
    'continuously between the two extremes. The phugoid is slower still (period ~159s), so this run plays ' +
    'over 320s to show two full cycles.',
  coefficients: FIGHTER.coefficients,
  defaultParams: { ...FIGHTER.defaultParams, altitude: 11000 },
  defaultX0: FIGHTER.defaultX0,
  // Phugoid period here is ~159s (wn~0.039 rad/s) — even slower than the Fighter baseline.
  tSpan: [0, 320],
  defaultChartStateIndex: 3,
  // Same lateral coefficients as FIGHTER (same airframe) — only defaultParams.altitude
  // differs, and that alone is enough to push the Dutch Roll mode (not just the Spiral)
  // into mild instability too: lower dynamic pressure at altitude shrinks every damping term,
  // including the yaw-rate damping that Dutch Roll depends on.
  lateral: {
    ...FIGHTER.lateral,
    whatToLookFor:
      'Watch p (roll rate) in the modal decomposition: at this altitude, thinner air weakens damping enough ' +
      'that the Dutch Roll (dash-dot) joins the Spiral (dotted) in slow instability — both grow now, not ' +
      'just the Spiral, though both do so much more slowly than any realistic aircraft would be flown ' +
      'uncorrected. Roll Subsidence (dashed) stays stable. Try the altitude slider to watch Dutch Roll cross ' +
      'from stable to unstable.',
  },
  visualStyle: FIGHTER.visualStyle,
};

export const AIRFRAME_PRESETS: AirframePreset[] = [
  GENERAL_AVIATION,
  GENERAL_AVIATION_AFT_CG,
  FIGHTER,
  FIGHTER_HIGH_ALTITUDE,
];
