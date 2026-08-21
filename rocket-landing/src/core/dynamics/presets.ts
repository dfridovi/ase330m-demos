// Scenario presets set the same initial conditions the student can otherwise reach by dragging
// the rocket and moving the orientation/descent-rate sliders (px0, py0, theta0, vy0) -- vx0 and
// omega0 are always 0, matching what the UI actually exposes control over.
export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  px0: number;
  py0: number;
  theta0: number;
  vy0: number;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'straight-approach',
    label: 'Straight approach',
    description: 'Descending gently, directly above the pad -- a good first landing to try.',
    px0: 0,
    py0: 45,
    theta0: 0,
    vy0: -6,
  },
  {
    id: 'off-to-the-side',
    label: 'Off to the side',
    description: 'Starts well downrange of the pad, so the controller has to correct sideways too.',
    px0: 8,
    py0: 40,
    theta0: 0,
    vy0: -4,
  },
  {
    id: 'tumbling-in',
    label: 'Tumbling in',
    description: 'A noticeable initial tilt and horizontal drift -- a harder recovery, and not always survivable.',
    px0: -15,
    py0: 50,
    theta0: -0.2,
    vy0: -6,
  },
];
