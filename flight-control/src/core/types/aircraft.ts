export interface PhysicalParams {
  mass: number; // kg
  Iyy: number; // kg m^2, pitch moment of inertia
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
  /** Short identity blurb (what kind of aircraft this is). */
  description: string;
  coefficients: LongitudinalCoefficients;
  defaultParams: PhysicalParams;
  /** [du, alpha, q, theta] initial-condition perturbation used for the "trim hold" (pure
   * disturbance-rejection) maneuver. */
  disturbanceX0: [number, number, number, number];
  visualStyle: AirframeVisualStyle;
}
