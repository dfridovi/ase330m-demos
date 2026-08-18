import type { AirframePreset } from '../types/aircraft.ts';

// Same airframe/coefficients as aircraft-explorer's GENERAL_AVIATION preset (see that repo's
// presets.ts for the tuning rationale — phugoid wn~0.21 rad/s, zeta~0.08, matching the course's
// own MATLAB reference). Reused here so students see the same aircraft in both demos.
export const GENERAL_AVIATION: AirframePreset = {
  id: 'general-aviation',
  name: 'General Aviation',
  description: 'Light single-engine aircraft, e.g. a Cessna/Navion-class trainer.',
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
    wingArea: 17.0,
    meanChord: 1.7,
    trimSpeed: 53.6,
    altitude: 0,
    cgShiftFraction: 0,
  },
  disturbanceX0: [2, 0.03, 0, 0],
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
