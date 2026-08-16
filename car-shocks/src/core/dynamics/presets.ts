import { resonantFrequency } from './frequencyResponse.ts';

export interface Preset {
  id: string;
  label: string;
  description: string;
  m: number;
  k: number;
  c: number;
  // Only set for presets that also want to place the forcing-frequency slider somewhere
  // specific (e.g. at resonance) — most presets leave omega wherever the student had it.
  omega?: number;
}

const RESONANCE_PARAMS = { m: 300, k: 20000, c: 350 };
const resonanceOmega = resonantFrequency(RESONANCE_PARAMS);
if (resonanceOmega === null) {
  throw new Error('RESONANCE_PARAMS must be lightly damped enough to have a resonance peak');
}

export const PRESETS: Preset[] = [
  {
    id: 'stock',
    label: 'Stock shocks',
    description: 'Well-damped factory shocks — the bounce dies out within a cycle or two.',
    m: 300,
    k: 20000,
    c: 1500,
  },
  {
    id: 'worn',
    label: 'Worn shocks',
    description: 'Low damping — the mechanic\'s classic tell: the hood keeps bouncing.',
    m: 300,
    k: 20000,
    c: 400,
  },
  {
    id: 'stiff',
    label: 'Stiff aftermarket',
    description: 'Higher spring stiffness and damping — a firmer, faster-settling ride.',
    m: 300,
    k: 32000,
    c: 1700,
  },
  {
    id: 'resonance',
    label: 'Forcing at resonance',
    description:
      'Light damping with the forcing frequency dialed to ω_r — the bounce amplitude builds far beyond the static deflection.',
    ...RESONANCE_PARAMS,
    omega: resonanceOmega,
  },
];
