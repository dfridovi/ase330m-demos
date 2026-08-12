export interface PhysicalParams {
  mass: number; // kg
  Iyy: number; // kg m^2, pitch moment of inertia
  Ixx: number; // kg m^2, roll moment of inertia
  Izz: number; // kg m^2, yaw moment of inertia
  Ixz: number; // kg m^2, roll-yaw product of inertia
  wingArea: number; // m^2
  meanChord: number; // m, mean aerodynamic chord (c-bar)
  trimSpeed: number; // m/s, U0
  altitude: number; // m, used to derive air density via ISA
  cgShiftFraction: number; // fraction of chord, aft-positive, relative to preset baseline CG
}

/** Wingspan (m), derived from a rectangular-wing approximation (S = b * c-bar) — the same
 * approximation the 3D visualization already uses for the rendered geometry, reused here so
 * the physics and the visual model never disagree about the airplane's span. */
export function wingSpan(params: PhysicalParams): number {
  return params.wingArea / params.meanChord;
}

export interface LongitudinalCoefficients {
  CL0: number; // trim lift coefficient
  CLalpha: number; // 1/rad
  CD0: number;
  CDalpha: number; // 1/rad
  Cmalpha: number; // 1/rad, at baseline CG (negative for static stability)
  Cmalphadot: number; // 1/rad
  Cmq: number; // 1/rad
  CLdeltae: number; // 1/rad
  Cmdeltae: number; // 1/rad
}

/** Lateral-directional non-dimensional stability & control derivatives, 1/rad (rate
 * derivatives are per non-dimensional rate, e.g. p*b/2U0 — mirrors LongitudinalCoefficients'
 * convention). CYp/CYr/CYdeltaa are conventionally negligible and can be left at 0. */
export interface LateralCoefficients {
  CYbeta: number;
  CYp: number;
  CYr: number;
  CYdeltaa: number;
  CYdeltar: number;
  Clbeta: number;
  Clp: number;
  Clr: number;
  Cldeltaa: number;
  Cldeltar: number;
  Cnbeta: number;
  Cnp: number;
  Cnr: number;
  Cndeltaa: number;
  Cndeltar: number;
}

/** Lateral-directional counterpart to the top-level longitudinal fields on AirframePreset —
 * nested rather than flattened since it's a distinct axis of the same airplane (physical
 * params like mass/wingArea/trimSpeed stay shared at the top level; only the axis-specific
 * coefficients/initial-condition/playback-window/chart-default differ). */
export interface LateralAirframeData {
  coefficients: LateralCoefficients;
  /** [beta, p, r, phi] initial-condition perturbation used when this preset is selected. */
  defaultX0: [number, number, number, number];
  tSpan: [number, number];
  /** 0=beta, 1=p, 2=r, 3=phi — matches the lateral STATE_OPTIONS in ModalContributionChart. */
  defaultChartStateIndex: 0 | 1 | 2 | 3;
  whatToLookFor: string;
}

/** Cosmetic-only shape parameters for the 3D model — no effect on the physics. */
export interface AirframeVisualStyle {
  wingSweepDeg: number;
  wingTaperRatio: number; // tip chord / root chord
  tailSweepDeg: number;
  tailTaperRatio: number;
  finSweepDeg: number;
  finTaperRatio: number;
  fuselageColor: string;
  wingColor: string;
  tailColor: string;
}

export interface AirframePreset {
  id: string;
  name: string;
  /** Short identity blurb (what kind of aircraft this is). Shown as the preset button's tooltip. */
  description: string;
  /** Guidance on what to watch for in the animation/charts — the pedagogical point of this preset. */
  whatToLookFor: string;
  coefficients: LongitudinalCoefficients;
  defaultParams: PhysicalParams;
  /** [du, alpha, q, theta] initial-condition perturbation used when this preset is selected. */
  defaultX0: [number, number, number, number];
  /**
   * Playback/simulation window [t0, t1] in seconds. Long enough to show at least one full
   * phugoid cycle — the phugoid period scales with 1/wn, which varies a lot across presets
   * (light, slow GA aircraft vs. fast, high-flying fighters), so this can't be one constant.
   */
  tSpan: [number, number];
  /**
   * Which state (0=du, 1=alpha, 2=q, 3=theta — matches ModalContributionChart's STATE_OPTIONS)
   * the modal decomposition chart should default to for this preset. alpha and q are the
   * short-period's own states — the phugoid moves them very little by construction (that's
   * the classical "constant angle of attack" phugoid approximation), so defaulting to alpha
   * makes an aircraft with a strong phugoid look like it has none. theta (and du) are where
   * the phugoid actually lives, so most presets should point here instead.
   */
  defaultChartStateIndex: 0 | 1 | 2 | 3;
  lateral: LateralAirframeData;
  visualStyle: AirframeVisualStyle;
}
